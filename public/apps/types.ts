import { AppMountParameters, CoreStart } from '../../../../src/core/public';
import { AppPluginStartDependencies } from '../types';

export interface AppDependencies {
    coreStart: CoreStart,
    navigation: AppPluginStartDependencies,
    params: AppMountParameters
}
