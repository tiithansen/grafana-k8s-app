import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Clusters } from '../../pages/Clusters';
import { Workloads } from '../../pages/Workloads';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { Network } from 'pages/Network';

export const Routes = () => {  
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.Clusters}`)} component={Clusters} />
      <Route path={prefixRoute(`${ROUTES.Workloads}`)} component={Workloads} />
      <Route path={prefixRoute(`${ROUTES.Network}`)} component={Network} />
      <Redirect to={prefixRoute(ROUTES.Clusters)} />
    </Switch>
  );
};
