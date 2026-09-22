import React from 'react';
import AppRoute from './Routes/app.route.jsx';
import { BrowserRouter } from "react-router-dom";
import "./App.scss";

const App = () => {
  return (
    <main>
      <BrowserRouter>
        <AppRoute />
      </BrowserRouter>
    </main>
  )
}

export default App;
