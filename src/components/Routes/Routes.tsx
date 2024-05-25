import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Clusters } from '../../pages/Clusters';
import { Workloads } from '../../pages/Workloads';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { usePluginProps } from 'utils/utils.plugin';

export const Routes = () => {

  const props = usePluginProps();
  console.log(props);
  
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.Clusters}`)} component={Clusters} />
      <Route path={prefixRoute(`${ROUTES.Workloads}`)} component={Workloads} />
      <Redirect to={prefixRoute(ROUTES.Clusters)} />
    </Switch>
  );
};
