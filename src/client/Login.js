// react packages
import React from "react";
import Constants from 'expo-constants'

// oauth packages
import * as Facebook from 'expo-facebook';
import {Google} from "expo";

// styling packages
import {StyleSheet, Image, TouchableOpacity, Button, Text, View} from "react-native";
import * as Animatable from 'react-native-animatable';

// style sheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  header_spacing: {
    flex: 0.30
  },
  logo_container: {
    flex: 0.40
  },
  logo: {
    width: 150,
    height: 150
  },
  login_btn: {
    flex: 0.10,
    justifyContent: "center",
    alignItems: "center"
  },
  guest_btn_text: {
    color: "#C0C0C0",
    fontWeight: "bold",
    fontSize: 16
  }
});

class Login extends React.Component {
  // render the component's views
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header_spacing}></View>
        <View style={styles.logo_container}>
          <Animatable.Image
            style={styles.logo}
            animation="fadeInDown"
            source={require("../../assets/icon.png")} />
        </View>
        <TouchableOpacity style={styles.login_btn}>
          <Button color="#4267B2"
            onPress={() => this.loginFacebook()}
            title='Connect with Facebook' />
        </TouchableOpacity>
        <TouchableOpacity style={styles.login_btn}>
          <Button color="#DE4D3A"
            onPress={() => this.loginGoogle()}
            title='Connect with Google' />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => this.loginGuest()}
          style={styles.login_btn}>
            <Text style={styles.guest_btn_text}>Login as Guest</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // login using facebook
  async loginFacebook() {
    // request the user to login to facebook
    const facebookAppId = Constants.manifest.facebookAppId;
    const {type, token} = await Facebook.logInWithReadPermissionsAsync(
      facebookAppId, {
        permissions: ["public_profile", "email"]
    });

    // handle the user's login
    if(type == "success") {
      const graphRequest = "https://graph.facebook.com/me?access_token="
        + token + "&format=json&fields=id,name,email,picture.type(large)";
      const profile = await fetch(graphRequest);

      // load the home page
      this.props.navigation.replace("Home", {
        token: undefined,
        name: undefined,
        email: undefined,
        profile_photo: undefined
      });
    }
  }

  // login using google
  async loginGoogle() {
    // request the user to login to google
    const {type, accessToken, user} = await Google.logInAsync({
      iosClientId: "",
      androidClientId: "",
      iosStandaloneAppClientId: "",
      androidStandaloneAppClientId: ""
    });

    // handle the user's login
    if(type == "success") {
      // load the home page
      this.props.navigation.replace("Home", {
        token: undefined,
        name: undefined,
        email: undefined,
        profile_photo: undefined
      });
    }
  }

  // login as a guest
  loginGuest() {
    this.props.navigation.replace("Home", {
      token: -1,
      name: "Guest"
    });
  }
}
export default Login;
