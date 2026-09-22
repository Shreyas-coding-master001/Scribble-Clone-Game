import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Draw from "../Features/Play/Draw.jsx";
import Home from '../Features/Home/Home.jsx';

const AppRoute = () => {
  return (
    <Routes>
        <Route path="/*" element={<Home />} />
        <Route path="/play" element={<Draw />} />
    </Routes>
  )
}

export default AppRoute;
