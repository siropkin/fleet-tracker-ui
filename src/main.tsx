import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CacheProvider, AsyncBoundary } from '@data-client/react';
import { NextUIProvider } from '@nextui-org/react';

import Home from '@pages/Home';
import Race from '@pages/Race';
import Error from '@pages/Error';

import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <Error />,
  },
  {
    path: 'races/:id',
    element: <Race />,
    errorElement: <Error />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NextUIProvider>
      <CacheProvider>
        <AsyncBoundary fallback="loading" errorComponent={Error}>
          <RouterProvider router={router} />
        </AsyncBoundary>
      </CacheProvider>
    </NextUIProvider>
  </React.StrictMode>,
);
