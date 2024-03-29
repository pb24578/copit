<img src="assets/icon.png" height="20%" width="20%"></img>

# Copit
An IOS and Android app that notifies people of freebies, events, parties, and many other things that are nearby their area.

### Server-side
Copit uses [Express](https://expressjs.com/), [Socket.IO](https://socket.io/), and [MySQL](https://www.mysql.com/) for the server-side.
- Express is used to run the web-server
- Socket.IO is used to run the socket server, which wraps around the Express server
- MySQL is the database management server

Configure the server properties in the ```server.json``` file located in the ```config/server``` directory of the project.

Then setup the database by importing the ```copit.sql``` file in MySQL. The file is located in the ```app/sql``` directory of the project.

Once ```server.json``` is configured and the database is setup, install the server-side dependencies by running:
```console
cd app/server
npm install
```

Once the server-side dependencies are installed, start the server by running:
```console
cd app/server
node Index.js
```
- The server <b>must</b> be started in the ```app/server``` directory or uploading errors will occur

### Client-side
Copit uses React Native for the client-side, specifically with [Expo](https://expo.io/).

Install the client-side dependencies by running:
```console
npm install
```

Once the client-side dependencies are installed, start the Expo app by running:
```console
expo start
```
then follow the instructions on the console to load the app on your phone or emulator.

### Expo MapView
Copit uses Google Maps for Android phones and Apple Maps for IOS phones.

In order to render the map, Copit uses Expo's [MapView](https://docs.expo.io/versions/latest/sdk/map-view/), which is a Map component that uses Google or Maps on Android or IOS phones, respectively.

MapView will work when testing on the Expo client, but when publishing to the Apple or Google Play store the MapView will not render due to API key limitations.

In order for the map to render once publishing the app, follow the instructions from the Expo documentation [here](https://docs.expo.io/versions/latest/sdk/map-view/).

### SMTP Service
Copit uses the ```nodemailer``` package to send emails from the the server to users.

To setup SMTP, edit the ```email_service.json``` using your SMTP service. The file is located in the ```config/email``` directory.
