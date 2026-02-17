import type { TestInfo } from '@playwright/test';
import type { UserCredentials } from '../pages/login';
import { GlobalRelayApp, loadGlobalRelayApp } from './setup';

let singleton: GlobalRelayApp | undefined;
let starting: Promise<GlobalRelayApp> | undefined;

export async function getOrStartApp(credentials: UserCredentials, testInfo: TestInfo) {
  if (singleton) return singleton;

  if (!starting) {
    starting = loadGlobalRelayApp(0, credentials, testInfo).then(app => {
      singleton = app;
      return app;
    });
  }

  return starting;
}

export async function stopApp() {
  if (!singleton) return;
  await singleton.electronApp.close();
  singleton = undefined;
  starting = undefined;
}