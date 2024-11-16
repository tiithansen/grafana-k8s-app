//import { TypedVariableModel } from '@grafana/data';
//import { getTemplateSrv } from '@grafana/runtime';
//import { AnalyticsOptions } from './options';
// import { TemplateVariable } from 'payload';

export function isNew(pathname: string) {
  const isNew = pathname === '/dashboard/new';
  console.log(pathname + ' is new: ' + isNew);
  return isNew;
}

export function getUidFromPath(pathname: string) {
  if (!isNew(pathname)) {
    const path = pathname.split('/');
    if (path && path.length > 2) {
      return path[2];
    }
  }
  return '';
}

export function unixFromMs(ms: number) {
  return Math.floor(ms / 1000);
}

export function getTimestamp() {
  return unixFromMs(new Date().getTime());
}

export function isValidUrl(str: string, base?: string | URL | undefined) {
  try {
    new URL(str, base);
  } catch (_) {
    return false;
  }

  return true;
}

export function throwOnBadResponse(r: Response) {
  const status = r.status.toString();
  const regExp = /^(0)|(20[0-4])$/;

  if (!regExp.test(status)) {
    throw new Error(`Returned status ${status}`);
  }
  return r;
}

/*export function getVariables(templateVars: TypedVariableModel[]) {
  const variables: TemplateVariable[] = templateVars.map((v: TypedVariableModel) => {
    // Note: any because VariableModel does not define current
    const untypedVariableModel: any = v;

    let multi = false;
    let value: string[] | string | null | undefined = untypedVariableModel?.current?.value;

    if (typeof value === 'string' && value !== '') {
      value = [value];
    } else if (!Array.isArray(value)) {
      value = [];
    } else {
      multi = true;
    }

    return {
      name: v.name,
      label: v.label ?? '',
      type: v.type,
      multi: multi,
      values: value,
    };
  });

  return variables;
}

export function getVars(options: AnalyticsOptions) {
  const templateSrv = getTemplateSrv();

  const server = templateSrv.replace(options.server);
  const dashboardName = templateSrv.replace(options.dashboard);
  const variables = getVariables(templateSrv.getVariables());

  return {
    server,
    dashboardName,
    variables,
  };
}*/
