import axios, { AxiosResponse } from 'axios';
import {
  useAsyncCallback,
  UseAsyncCallbackOptions,
  UseAsyncReturn,
} from 'react-async-hook';

const apiAxios = axios.create({
  baseURL: process.env.PUBLIC_API_URL
});

type MaybePromise<T> = Promise<T> | T;
type AsyncApiCallback = <R = any, Args extends any[] = []>(
  asyncFunction: (...args: Args) => MaybePromise<AxiosResponse<R>>,
  options?: UseAsyncCallbackOptions<R>
) => UseAsyncReturn<R, Args>;

const useApiCallback: AsyncApiCallback = (asyncFunction, options) => {
  return useAsyncCallback(async (...args: Parameters<typeof asyncFunction>) => {
    try {
      const result = (await asyncFunction(...args)) as unknown as AxiosResponse;
      return result?.data;
    } catch (e) {
      throw e?.response?.data ?? {};
    }
  }, options);
};

export { useApiCallback };
export default apiAxios;
