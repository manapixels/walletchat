import { ColorModeScript } from '@chakra-ui/react'
import * as React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { ChakraProvider } from '@chakra-ui/react'

import { App } from './App'
import reportWebVitals from './reportWebVitals'
import * as serviceWorker from './serviceWorker'
import WalletProvider from './context/WalletProvider'
import { theme } from './theme'
import ENSProvider from './context/ENSProvider'

axios.defaults.baseURL = `${process.env['REACT_APP_COVALENT_API_URL']}`

ReactDOM.render(
   <React.StrictMode>
      <ColorModeScript />
      <BrowserRouter>
         <WalletProvider>
            {/* <ENSProvider> */}
               <ChakraProvider theme={theme}>
                  <App />
               </ChakraProvider>
            {/* </ENSProvider> */}
         </WalletProvider>
      </BrowserRouter>
   </React.StrictMode>,
   document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorker.unregister()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()