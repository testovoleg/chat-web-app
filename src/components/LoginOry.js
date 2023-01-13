// Попытка объединить две авторизации
import React, { useEffect, useState } from 'react';
import '../styles/Login.css';
import { Backdrop, CircularProgress, Fade, TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Alert } from '@material-ui/lab';
import { clearToken, getToken, storeToken } from '../helpers/StorageHelper';
import { makeStyles } from '@material-ui/styles';
import { useTranslation } from 'react-i18next';
import { ApplicationContext } from '../contexts/ApplicationContext';
import packageJson from '../../package.json';
import { FrontendApi, Configuration, Session, Identity } from "@ory/client"

// Get your Ory url from .env
// Or localhost for local development
// Почитать про API ORY можно по ссылке https://www.ory.sh/docs/reference/api
const basePath = process.env.REACT_APP_ORY_URL || "http://localhost:4000/.ory"
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

export default function Login(props) {
	const [session, setSession] = useState([])
  const [logoutUrl, setLogoutUrl] = useState(0)
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
	/////ORY
	const getUserName = (identity: Identity) =>
    identity.traits.email || identity.traits.username
	useEffect(() => {
		ory.toSession().then(({ data }) => {
			console.log(data) // То, что возвращает ORY. Увидеть можно по http://localhost:4000/.ory/sessions/whoami либо в консоли
		  // User has a session!
		  setSession(data)
		  ory.createBrowserLogoutFlow().then(({ data }) => {
			// Get also the logout url
			console.log(`Для разлогинивания ORY перейти по: ${data.logout_url}`)
			//setLogoutUrl(data.logout_url)

		  })
		})
		.catch((err) => {
		  console.log('ORY error:',err)
		  // Redirect to login page
		  window.location.replace(`${basePath}/ui/login`)
		})
		if (errorCase) {
			setLoginError(errorMessages[errorCase]);

			if (errorCase === 'invalidToken') {
				console.log('Ошибка типовой аутентификации:', errorCase);
				logoutToClearSession();
			}
		}

		/////ORY
		const token = getToken();
		//const token = "630a85d41fec9bac44d3662d6ce6936ee5cf48b1";  //Токен Юры  y.rastopchinov@5systems.ru Rast_9136
		
		if (token) {
			storeToken(token); //Сохранить токен в кэше == window.activeStorage.setItem(STORAGE_TAG_TOKEN, token)
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
		
	}, []);

  // Returns either the email or the username depending on the user's Identity Schema




	/* useEffect(() => {
		if (errorCase) {
			setLoginError(errorMessages[errorCase]);

			if (errorCase === 'invalidToken') {
				logoutToClearSession();
			}
		}

		const token = getToken();
		if (token) {
			setValidatingToken(true);

			apiService.baseCall(
				(response) => {
					// Redirect to main route
					history.push('/main');
				},
				(error) => {
					setValidatingToken(false);

					// TODO: Make sure the response is Unauthorized
					clearToken();
				}
			);
		}
	}, []);*/

  if (!session) {
    // Still loading
    return <h1>Loading...</h1>
  }

  
	

	

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
				console.log('Token', response.data.token);

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

		<Backdrop className={classes.backdrop} open={isLoggingIn}>
			<CircularProgress color="inherit" />
		</Backdrop>
	</div>
);
}
