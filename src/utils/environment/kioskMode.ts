import debug from 'debug';

import { onElectronReady } from './electron';
import { getConfigField } from '../../coordinator/config';

const l = debug('soundsync');

export const startKioskMode = () => {
  onElectronReady((electron) => {
    const window = new electron.BrowserWindow({
      // kiosk: true,
    });
    const localWebuiUrl = `http://localhost:${getConfigField('port')}/?disable-local-sink=true`;
    l(`Starting kiosk mode with url: ${localWebuiUrl}`);
    window.loadURL(localWebuiUrl);
  });
};
