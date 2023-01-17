import React, { useEffect, useState } from 'react';
import '../styles/Login.css';
import { Backdrop, CircularProgress, Fade, TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Alert } from '@material-ui/lab';
import { clearToken, getToken,  getSession, storeToken, storeSession, storelogouturl } from '../helpers/StorageHelper';
import { clearUserSession, clearUserOrySession} from '../helpers/ApiHelper';
import { makeStyles } from '@material-ui/styles';
import { useTranslation } from 'react-i18next';
import { ApplicationContext } from '../contexts/ApplicationContext';
import packageJson from '../../package.json';
import { FrontendApi, Configuration, Session, Identity } from "@ory/client"
import LoadingScreen from './Main/LoadingScreen';

//	Get your Ory url from .env
//	Or localhost for local development
//	Почитать про API ORY можно по ссылке https://www.ory.sh/docs/reference/api
//	Если ory proxy http://localhost:3000, то добавляем .ory, при этом после входа переадресовывать не умеет на локалхост
//	Правила переадресации в консоли ORY, ссылка скорее всего непостоянная https://console.ory.sh/projects/54f40439-c43c-4331-8247-5f907ea49327/browser-redirects
//	Если ory tunnel --dev http://localhost:3000, то без .ory
const basePath = process.env.REACT_APP_ORY_URL || "http://localhost:4000/.ory"
const basePathapp = process.env.REACT_APP_ORY_REDIRECT_URL
const ory = new FrontendApi(
  new Configuration({
    basePath,
    baseOptions: {
      withCredentials: true,
    },
  }),
)


const useStyles = makeStyles((theme) => ({
	backdrop: {
		zIndex: theme.zIndex.drawer + 1,
		color: '#fff',
	},
}));
	///////////


export default function Login(props) {
	const [session, setSession] = useState({})
	const [logoutUrl, setLogoutUrl] =  useState('')
	////////////////

	const { apiService } = React.useContext(ApplicationContext);

	const { t } = useTranslation();

	const { errorCase } = useParams();

	const errorMessages = {
		incorrectRole: 'Only admins and users can access to our web app.',
		notLoggedIn: 'You are not logged in.',
		invalidToken: 'Invalid token.',
	};

	const classes = useStyles();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoggingIn, setLoggingIn] = useState(false);
	const [isValidatingToken, setValidatingToken] = useState(false);
	const [loginError, setLoginError] = useState();

	const history = useHistory();
	const location = useLocation();

	useEffect(() => {
		if (getSession()==null) {
			//clearUserSession('notLoggedIn', location, history);
			clearUserOrySession('notLoggedIn', location, history);
			console.log('Нет сессии')
			window.location.replace(`${process.env.REACT_APP_ORY_URL}/ui/login?return_to=${process.env.REACT_APP_ORY_REDIRECT_URL}`)
		}
		ory
		.toSession()
		.then(({ data }) => {
		  // User has a session!
		  storeSession(JSON.stringify(data))
		  const token = "630a85d41fec9bac44d3662d6ce6936ee5cf48b1";  //Токен Юры  y.rastopchinov@5systems.ru Rast_9136
		  storeToken(token); //Сохранить токен в кэше, равносильно window.activeStorage.setItem(STORAGE_TAG_TOKEN, token)
		  setValidatingToken(true);	
		  console.log('Есть сессия')	  
		  console.log('Session', data);
		  ory.createBrowserLogoutFlow().then(({ data }) => {
			// Get also the logout url
			//setLogoutUrl(data.logout_url)
			storelogouturl(data.logout_url+'&return_to='+basePathapp); 
		  })
		})
		.catch((err) => {
		  console.error(err)
		  // Redirect to login page
		  window.location.replace(`${basePath}/ui/login?return_to=${basePathapp}`)
		})

		apiService.baseCall(
			(response) => {
				// Redirect to main route
				history.push('/main');
			},
			(error) => {
				console.log('Ошибка типовой аутентификации:', error);
				setValidatingToken(false);
				// TODO: Make sure the response is Unauthorized
				clearToken();
			})
	}, []);

	/*useEffect(() => {
				//ORY
				
		//const token = getToken();
		const token = "630a85d41fec9bac44d3662d6ce6936ee5cf48b1";  //Токен Юры  y.rastopchinov@5systems.ru Rast_9136
		storeToken(token); //Сохранить токен в кэше, равносильно window.activeStorage.setItem(STORAGE_TAG_TOKEN, token)


		if (token) {			
			setValidatingToken(true);
			console.log('Токен типовой аутентификации:', token);
			apiService.baseCall(
				(response) => {
					// Redirect to main route
					history.push('/main');
				},
				(error) => {
					console.log('Ошибка типовой аутентификации:', error);
					setValidatingToken(false);

					// TODO: Make sure the response is Unauthorized
					clearToken();
				}
			);
		}
	}, []);*/

	const doLogin = async (e) => {
		e.preventDefault();

		// Check if username or password is empty
		if (username.trim() === '' || password.trim() === '') {
			// TODO: Display error on UI
			console.log('Empty credentials');
			return false;
		}

		// Display the loading animation
		setLoggingIn(true);

		apiService.loginCall(
			username,
			password,
			(response) => {
				// Store token in local storage
				storeToken(response.data.token);

				// Android web interface
				if (window.AndroidWebInterface) {
					window.AndroidWebInterface.registerUserToken(
						response.data.token ?? ''
					);
				}

				// Redirect to main route
				history.push((location.nextPath ?? '/main') + (location.search ?? ''));
			},
			(error) => {
				// Hide the loading animation
				setLoggingIn(false);
				setLoginError(undefined);

				if (error.response) {
					// Current status code for incorrect credentials must be changed to 401 or 403
					if ([400, 401, 403].includes(error.response.status)) {
						setLoginError('Incorrect username or password.');
					} else {
						setLoginError('An error has occurred. Please try again later.');
					}
				}
			}
		);
	};

	const logoutToClearSession = () => {
		apiService.logoutCall();
	};

	return (
		<div className="login">


			<Backdrop className={classes.backdrop} open={isLoggingIn}>
				<CircularProgress color="inherit" />
			</Backdrop>
		</div>
	);
}

/*
			<Fade in={true}>
			
				<div className="login__body">
					<div className="login__body__logoWrapper">
						<img
							className="login__body__logo"
							src={process.env.REACT_APP_LOGO_URL ?? '/logo.png'}
							alt="Logo"
						/>
					</div>

					<h2>{t('Welcome')}</h2>
					<p>{t('Please login to start')}</p>

					<form onSubmit={doLogin}>
						<TextField
							data-test-id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							label={t('Username')}
							size="medium"
							fullWidth={true}
						/>
						<TextField
							data-test-id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							type="password"
							label={t('Password')}
							size="medium"
							fullWidth={true}
						/>
						<Button
							data-test-id="submit"
							type="submit"
							color="primary"
							fullWidth={true}
							disableElevation
						>
							{t('Log in')}
						</Button>
					</form>

					{isValidatingToken && (
						<div className="login__validatingToken">
							<h2>{t('Welcome')}</h2>
							<p>{t('We are validating your session, please wait.')}</p>
						</div>
					)}

					{loginError && <Alert severity="error">{t(loginError)}</Alert>}

					<div className="login__body__versionWrapper">
						<span className="login__body__version">
							Version: {packageJson.version}
						</span>
					</div>
				</div>
			</Fade>

*/