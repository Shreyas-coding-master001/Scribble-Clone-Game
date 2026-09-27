import React from 'react';
import AppRoute from './Routes/app.route.jsx';
import { BrowserRouter } from "react-router-dom";
import ScribbleContextProvider from './globle.context.jsx';
import "./App.scss";

const App = () => {
  return (
    <main>
      <ScribbleContextProvider>
        <BrowserRouter>
          <AppRoute />
        </BrowserRouter>
      </ScribbleContextProvider>
    </main>
  )
}

export default App;
