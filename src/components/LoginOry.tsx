// Попытка объединить две авторизации
import React, { useEffect, useState } from 'react';
import '../styles/Login.css';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { clearToken, getToken, storeToken } from '../helpers/StorageHelper';
import { FrontendApi, Configuration, Session, Identity } from "@ory/client"
const basePath = process.env.REACT_APP_ORY_URL
const basePathapp = process.env.REACT_APP_ORY_REDIRECT_URL
//	Get your Ory url from .env
//	Or localhost for local development
//	Почитать про API ORY можно по ссылке https://www.ory.sh/docs/reference/api
//	Если ory proxy http://localhost:3000, то добавляем .ory, при этом после входа переадресовывать не умеет на локалхост
//	Правила переадресации в консоли ORY, ссылка скорее всего непостоянная https://console.ory.sh/projects/54f40439-c43c-4331-8247-5f907ea49327/browser-redirects
//	Если ory tunnel --dev http://localhost:3000, то без .ory

const ory = new FrontendApi(
	new Configuration({
	  basePath,
	  baseOptions: {
		withCredentials: true,
	  },
	}),
  )

  
export const LoginOryHTTP =() =>{
        // POST request using fetch inside useEffect React hook
		const [session, setSession] = useState<Session | undefined>()
  		const [logoutUrl, setLogoutUrl] = useState<string | undefined>()
		const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };
        fetch(`${basePath}/sessions/whoami`, requestOptions)
		.then((res) => res.json())
         .then((data) => {
            setSession(data.active);
         })
         .catch((err) => {
            console.log(err.message);
         });
			return session


/*		if (session==true){
			return true
		} else {
			return false
		}*/
		

		
    // empty dependency array means this effect will only run once (like componentDidMount in classes)
};

