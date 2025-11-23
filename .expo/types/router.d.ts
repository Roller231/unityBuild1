/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/..\components\Buttons\BalanceButton` | `/..\components\CaseRoulette` | `/..\components\UserContext` | `/..\components\api` | `/..\components\createOrLoadUser` | `/_sitemap` | `/api` | `/case` | `/crash` | `/profile`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
