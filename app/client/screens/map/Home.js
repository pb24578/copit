// react packages
import React from "react";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import * as Permissions from "expo-permissions";
import Constants from "expo-constants";

// styling packages
import {StyleSheet, Image, TouchableOpacity, Platform,
  StatusBar, Button, Text, Alert, View} from "react-native";
import GestureRecognizer from 'react-native-swipe-gestures';
import {Icon, Overlay} from "react-native-elements";
import * as Animatable from 'react-native-animatable';
import Spinner from 'react-native-loading-spinner-overlay';

// component classes
import ViewPing from "../../components/ping/ViewPing";

// config packages
import {timeInterval, distanceInterval} from "../../../../config/map/watch_position.json";

// style sheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  menu_btn: {
    position: "absolute",
    top: Constants.statusBarHeight,
    left: 10
  },
  search_btn: {
    position: "absolute",
    top: Constants.statusBarHeight + 60,
    left: 10
  },
  map: {
    flex: 1,
    zIndex: -1,
    width: "100%",
    height: "100%"
  },
  reorientation_btn: {
    position: 'absolute',
    bottom: 40,
    left: 15
  },
  swipe_up_container: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0)",
    width: "100%",
    height: Platform.OS === "ios" ? 135 : 75,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center"
  },
  swipe_up_text: {
    color: "#75B1DE",
    fontSize: 12,
    fontFamily: "ubuntu-regular"
  }
});

class Home extends React.Component {
  // construct the state of the component
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      location: {
        longitude: -97.73675,
        latitude: 30.28265
      },
      locationDelta: {
        longitudeDelta: 0.005,
        latitudeDelta: 0.005
      },
      markers: [],
      marker_visible: false,
      marker_params: {}
    }

    // initial map view
    this.mapView = undefined;

    // remove watch location
    this.removeWatch = undefined;
  }

  // called whenever the component loads
  componentDidMount() {
    this.watchLocation();
  }

  // watch the location of the user
  async watchLocation() {
    let {status} = await Permissions.askAsync(Permissions.LOCATION);
    if (status === "granted") {
      this.setState({loading: true});

      // continously watch the location of the user
      Location.watchPositionAsync({enableBalancedAccuracy: true, timeInterval: timeInterval,
        distanceInterval: distanceInterval}, (position) => {
        // receive the markers from the server
        this.receiveMarkers(position);
      }).then((resolved) => {
        // set the remove watch function
        this.removeWatch = resolved.remove;
        return;
      }).catch((error) => {
        this.setState({loading: false});
        Alert.alert("GPS Error!", "Please make sure your location (GPS) is turned on.");
      });
    }
  }

  // update the location of the user
  async updateLocation() {
    let {status} = await Permissions.askAsync(Permissions.LOCATION);
    if (status === "granted") {
      this.setState({loading: true});
      Location.getCurrentPositionAsync({enableBalancedAccuracy: true}).then((position) => {
        // receive the markers from the server
        this.receiveMarkers(position);
        return;
      }).catch((error) => {
        this.setState({loading: false});
        Alert.alert("GPS Error!", "Please make sure your location (GPS) is turned on.");
      });
    }
  }

  // receive the markers to place on the map
  async receiveMarkers(position) {
    let socket = this.props.navigation.state.params.socket;

    // emit a message to receive the markers
    socket.emit("receiveMarkers", {
      message: {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude
      },
      handle: "handleReceiveMarkers"
    });

    // listen for the markers from the server
    socket.on("receiveMarkers", (data) => {
      if(data.success) {
        // animate the map view's coordinate change
        if(this.mapView) {
          // the transition time in miliseconds
          let transitionTime = 1000;

          // animate the camera to the region
          this.mapView.animateCamera({
            center: {
              longitude: position.coords.longitude,
              latitude: position.coords.latitude
            }
          }, transitionTime);
        }

        // set the markers and update the current location
        this.setState({
          location: {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
          },
          locationDelta: {
            longitudeDelta: this.state.locationDelta.longitudeDelta,
            latitudeDelta: this.state.locationDelta.latitudeDelta
          },
          markers: JSON.parse(data.message)
        });
      } else {
        Alert.alert("Database Error!", data.message);
      }
      this.setState({loading: false});
      socket.off("receiveMarkers");
    });
  }

  // render the component's views
  render() {
    // gesture configuration
    const gestureConfig = {
      velocityThreshold: 0.10,
      directionalOffsetThreshold: 80
    };

    return (
      <View style={styles.container}>
        <Spinner visible={this.state.loading} />
        <Overlay
          animationType="fade"
          borderRadius={20}
          transparent={true}
          isVisible={this.state.marker_visible}
          onBackdropPress={() => this.setState({marker_visible: false})}>
          <ViewPing marker_params={this.state.marker_params} />
        </Overlay>
        <Icon containerStyle={styles.menu_btn} raised name="menu"
          onPress={() => this.loadMenuPage()} color="#1C7ED7" size={22} />
        <Icon containerStyle={styles.search_btn} raised name="search"
          onPress={() => this.loadSearchPage()} color="#1C7ED7" size={22} />
        <MapView
          ref={(mapView) => {this.mapView = mapView}}
          style={styles.map}
          initialRegion={{
            longitude: this.state.location.longitude,
            longitudeDelta: this.state.locationDelta.longitudeDelta,
            latitude: this.state.location.latitude,
            latitudeDelta: this.state.locationDelta.latitudeDelta,
          }}>
          <MapView.Marker
            title="You Are Here"
            coordinate={{
              longitude: this.state.location.longitude,
              latitude: this.state.location.latitude
            }} >
              <Icon name="person-pin-circle" type="material" color="#C1392B" size={40} />
          </MapView.Marker>
          {this.state.markers.map((marker, key) => (
            <MapView.Marker
              key={key}
              coordinate={{
                longitude: marker.longitude,
                latitude: marker.latitude
              }}
              onPress={() => this.loadViewPingPage(marker)} >
                {this.renderMarkerIcon(marker.category)}
            </MapView.Marker>
          ))}
        </MapView>
        <GestureRecognizer
          onSwipeUp={() => this.loadPingsPage()}
          config={gestureConfig}
          style={styles.swipe_up_container}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <Text style={styles.swipe_up_text}>Swipe to add ping!</Text>
            <Icon name="arrow-up" type="feather" color="#1C7ED7" />
          </Animatable.View>
        </GestureRecognizer>
        <TouchableOpacity activeOpacity={0.8} style={styles.reorientation_btn}>
          <Icon raised name="target" onPress={() => this.updateLocation()}
            type="material-community" color="#1C7ED7" />
        </TouchableOpacity>
      </View>
    );
  }

  // render the marker's icon based on its category
  renderMarkerIcon(category) {
    if(category == "Food") {
      return <Icon name="food" type="material-community" color="#FFB300" size={40} />;
    } else if(category == "Clothes") {
      return <Icon name="tshirt-crew-outline" type="material-community" color="#E4181B" size={40} />;
    } else if(category == "School") {
      return <Icon name="school" type="material-community" color="#FF7A1D" size={40} />;
    } else if(category == "Sports") {
      return <Icon name="ios-american-football" type="ionicon" color="#3E9C35" size={40} />;
    } else if(category == "Party") {
      return <Icon name="drink" type="entypo" color="#BD8DE3" size={40} />;
    } else if(category == "Org Events") {
      return <Icon name="calendar" type="font-awesome" color="#2F74B5" size={40} />;
    } else if(category == "Emergencies") {
      return <Icon name="warning" type="font-awesome" color="#FFCC00" size={40} />;
    } else if(category == "Conctraceptives") {
      return <Icon name="heart" type="feather" color="#E793A0" size={40} />;
    } else if(category == "Other") {
      return <Icon name="rocket" type="simple-line-icon" color="#1F1F21" size={40} />;
    } else {
      return <Icon name="question" type="antdesign" color="#FF0000" size={40} />;
    }
  }

  // return the expiration time of a marker
  getExpirationTime(marker) {
    // dates
    let expiresDate = new Date(marker.expires).getTime();
    let currentDate = new Date().getTime();

    // time constants
    const msPerSecond = 1000;
    const sPerHour = 3600;
    const mPerHour = 60;
    const hPerDay = 24;

    // get each precise time until expiration
    let untilExpires = Math.abs(expiresDate - currentDate) / msPerSecond;
    let hours = Math.floor(untilExpires / sPerHour) % hPerDay;
    let minutes = Math.floor(untilExpires / mPerHour) % mPerHour;
    let expires = "Expires in " + hours + " hr and " + minutes + " min";
    if(hours <= 0 && minutes <= 0) {
      expires = "This ping has expired.";
    }
    return expires;
  }

  // return the formatted likes as an Array
  getFormattedLikes(likes) {
    // convert the likes into an Array
    let markerLikes = likes;
    if(!markerLikes) {
      markerLikes = [];
    } else {
      markerLikes = JSON.parse(likes);
    }
    return markerLikes;
  }

  // load the view ping page
  loadViewPingPage(marker, updateMarkers) {
    let expires = this.getExpirationTime(marker);

    // get the distance in feet
    const toFeet = 5280;
    let distanceFeet = Math.round(marker.distance * toFeet);

    // convert the likes into a formatted Array
    let markerLikes = this.getFormattedLikes(marker.likes);

    // create an Array of updating every necessary markers state
    let updateAllMarkers = updateMarkers ? [this.updateLocation.bind(this),
      updateMarkers] : [this.updateLocation.bind(this)];

    // set the properties to the view ping component
    let socket = this.props.navigation.state.params.socket;
    this.setState({
      marker_visible: true,
      marker_params: {
        socket: socket,
        user_id: this.props.navigation.state.params.id,
        user_token: this.props.navigation.state.params.token,
        id: marker.id,
        longitude: marker.longitude,
        latitude: marker.latitude,
        picture: marker.picture,
        title: marker.title,
        author: marker.author,
        category: marker.category,
        likes: markerLikes,
        expires: expires,
        distance: distanceFeet,
        description: marker.description,
        updateAllMarkers: updateAllMarkers
      }
    });
  }

  // load the menu page
  loadMenuPage() {
    let socket = this.props.navigation.state.params.socket;
    this.props.navigation.navigate("Menu", {
      socket: socket,
      id: this.props.navigation.state.params.id,
      token: this.props.navigation.state.params.token,
      name: this.props.navigation.state.params.name,
      email: this.props.navigation.state.params.email,
      profile_photo: this.props.navigation.state.params.profile_photo,
      updateMarkers: this.updateLocation.bind(this),
      removeWatch: this.removeWatch
    });
  }

  // load the search page
  loadSearchPage() {
    // number of initial markers to load in the search page
    const loadMarkers = 10;

    let socket = this.props.navigation.state.params.socket;
    this.props.navigation.navigate("Search", {
      socket: socket,
      markers: this.state.markers.slice(0, loadMarkers),
      loadViewPingPage: this.loadViewPingPage.bind(this),
    });
  }

  // load the pings page
  loadPingsPage() {
    let socket = this.props.navigation.state.params.socket;
    this.props.navigation.navigate("Pings", {
      socket: socket,
      id: this.props.navigation.state.params.id,
      token: this.props.navigation.state.params.token,
      name: this.props.navigation.state.params.name,
      updateMarkers: this.updateLocation.bind(this)
    });
  }
}
export default Home;
