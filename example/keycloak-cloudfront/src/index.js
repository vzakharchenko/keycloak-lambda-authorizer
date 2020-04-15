import '@babel/polyfill';
import 'typeface-roboto';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import Header from './components/Header';


const Index = () => (
        <div>
            <Header />
            <App />
        </div>
);

ReactDOM.render(<Index />,
  window.document.getElementById('root'));
