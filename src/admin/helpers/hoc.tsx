import React, { forwardRef } from 'react';
import { GroupsContextProvider } from '@admin/features/groups/context/groups.context';
import _ from 'lodash';

function withWrapper<P>(
  Wrapper: React.FC<Partial<P>>,
  defaultWrapperProps: P = {} as any
) {
  return function <T extends object>(Component: React.FC<T>) {
    return (props: T) => (
      <Wrapper {...defaultWrapperProps}>
        <Component {...(props as T)} />
      </Wrapper>
    );
  };
}

type ComposedWrappers<CW> = {
  [key in keyof CW]: React.FC<CW[key]>;
};

type ComposedWrapperProps<T extends {}, CW> = T &
  {
    [key in keyof CW]?: CW[key] & Partial<{ disable?: boolean }>;
  } &
  Partial<{ unwrap?: boolean }>;

function composeWrappers<CW>(wrappers: ComposedWrappers<CW>) {
  return function <T extends object, R>(Component: React.FC<T>) {
    return forwardRef<R, ComposedWrapperProps<T, CW>>(
      ({ unwrap = false, ...allProps }, ref) => {
        const keys = Object.keys(wrappers).filter((k) => !allProps[k]?.disable);
        const props = _.omit(allProps, keys) as T;
        const restProps = _.pick(allProps, keys);

        if (unwrap || keys.length === 0) {
          return <Component {...props} ref={ref} />;
        }

        return (
          <>
            {keys.reduceRight((children, currentKey) => {
              const CurrentWrapper = wrappers[currentKey];
              const currentWrapperProps = restProps?.[currentKey] ?? {};

              return (
                <CurrentWrapper {...currentWrapperProps}>
                  {children}
                </CurrentWrapper>
              );
            }, <Component {...props} ref={ref} />)}
          </>
        );
      }
    );
  };
}

const withGroupsContext = withWrapper(GroupsContextProvider);

export { withWrapper, composeWrappers, withGroupsContext };
