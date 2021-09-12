import { Link as RouterLink, LinkProps } from 'react-router-dom';
import { ILinkProps, Link as MSLink } from '@fluentui/react';
import * as React from 'react';

declare const ROUTER_PATH: string;

type ReachProps = React.PropsWithoutRef<LinkProps<any>>;
type Props = ReachProps & ILinkProps;

const RelativeReachLink: React.FC<ReachProps> = ({ to, ...props }) => (
  <RouterLink to={ROUTER_PATH + to} {...props} />
);

const Link: React.FC<Props> = ({ to, replace, ...props }) => (
  <RouterLink to={to} replace={replace}>
    <MSLink {...props} />
  </RouterLink>
);

export { Link, RelativeReachLink, MSLink };
