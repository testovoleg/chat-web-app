import React, { useEffect, useState } from "react";
import { Provider } from 'react-redux';
import { ThemeProvider } from '@material-ui/styles';
import {
	BrowserRouter as Router,
	Route,
	Switch as RouteSwitch,
} from 'react-router-dom';

import Login from './components/Login';
import Main from './components/Main/Main';
import AppTheme from './AppTheme';
import { isIPad13 } from 'react-device-detect';
import { ApplicationContext } from './contexts/ApplicationContext';
import { AppConfig } from './contexts/AppConfig';
import configureAppStore from './store';
import { FrontendApi, Configuration, Session, Identity } from "@ory/client"

// Get your Ory url from .env
// Or localhost for local development
const basePath = process.env.REACT_APP_ORY_URL || "http://localhost:4000"
const ory = new FrontendApi(
  new Configuration({
    basePath,
    baseOptions: {
      withCredentials: true,
    },
  }),
)





const store = configureAppStore({});

function App({ config, apiService }) {
	//const [session, setSession] = useState([])
	//const [logoutUrl, setLogoutUrl] = useState(0)
	const [session, setSession] = useState<Session | undefined>()
	const [logoutUrl, setLogoutUrl] = useState<string | undefined>()
  
	// Returns either the email or the username depending on the user's Identity Schema
	const getUserName = (identity: Identity) =>
	  identity.traits.email || identity.traits.username
	  useEffect(() => {
		ory
		  .toSession()
		  .then(({ data }) => {
			// User has a session!
			setSession(data)
			ory.createBrowserLogoutFlow().then(({ data }) => {
			  // Get also the logout url
			  setLogoutUrl(data.logout_url)
			})
		  })
		  .catch((err) => {
			console.error(err)
			// Redirect to login page
			window.location.replace(`${basePath}/ui/login`)
		  })
	  }, [])
	
	  if (!session) {
		// Still loading
		return <h1>Loading...</h1>
	  }
	return (
		<Provider store={store}>
			<ThemeProvider theme={AppTheme}>
				<div className={'app' + (isIPad13 ? ' absoluteFullscreen' : '')}>
					<AppConfig.Provider value={config}>
						<ApplicationContext.Provider
							value={{
								apiService,
							}}
						>
							<Router>
								<RouteSwitch>
									<Route
										path={[
											'/main/chat/:waId',
											'/main/chat/:waId/message/:msgId',
											'/main',
										]}
										component={Main}
									/>
									<Route
										path={['/login/error/:errorCase', '/']}
										component={Login}
									/>
								</RouteSwitch>
							</Router>
						</ApplicationContext.Provider>
					</AppConfig.Provider>
				</div>
			</ThemeProvider>
		</Provider>
	);
}

export default App;
