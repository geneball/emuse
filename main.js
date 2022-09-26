async function main(){
  const { app, BrowserWindow } = require('electron')
//  const { default: installExtension, REDUX_DEVTOOLS } = require('electron-devtools-installer');

  const path = require('path')
  const isDevelopment = require('electron-is-dev');

  console.log(process.env);

  const createWindow = () => {
    const win = new BrowserWindow({
      width: 1100,
      height: 600,    
      webPreferences: {
        //preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: false,
      }
    })
    win.loadFile('index.html')
    const ses = win.webContents.session
    console.log(ses.getUserAgent())
  }
  app.whenReady().then(() => {
  //  installExtension(REDUX_DEVTOOLS)
  //  .then((name) => console.log(`Added Extension:  ${name}`))
  //  .catch((err) => console.log('An error occurred: ', err));

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  if (isDevelopment) {
    // this is to give Chrome Debugger time to attach to the new window 
    await new Promise(r => setTimeout(r, 1000));
  }

  //ses.setPermissionCheckHandler()
}
main();