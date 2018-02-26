//Mobile App
import React, { Component } from 'react';
import {Text, Alert, AppRegistry, Button, StyleSheet, View } from 'react-native';
import SocketIOClient from 'socket.io-client';
import { subscribeToTimer } from './src/api';
//const  socket = openSocket('http://localhost:3000');

class Greeting extends Component {
  render() {
    return (
      <Text>Heo {this.props.name}!</Text>
    );
  }
}

export default class ButtonBasics extends Component {
  constructor(props){
    super(props);
    this.state = {
      numberOfMessages: 1,
      latitude: null,
      longitude: null,
      error: null,
    }

    //this.socket = SocketIOClient('https://oxowvetxxa.localtunnel.me');
    this._onPressButton = this._onPressButton.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
      },
      (error) => this.setState({ error: error.message }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }

  _onPressButton() {
    this.componentDidMount();
    this.setState(prevState => ({
      numberOfMessages: prevState.numberOfMessages+1
    }));
    Alert.alert('You pressed the 1 button!');
  }

  oneMessage(words){
    return(
        <Greeting key={words} name={words} />
      );
  }

  render() {
    const listOfMessage = [];
    for(var i=0; i<this.state.numberOfMessages; i++)
    {
      listOfMessage.push(this.oneMessage(i));      
    }

    return (
      <View style={styles.container}>
        <View style={styles.messages}>
          {listOfMessage}
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={this._onPressButton}
            title="Press Me"
          />
        </View>
        <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Latitude: {this.state.latitude}</Text>
          <Text>Longitude: {this.state.longitude}</Text>
          {this.state.error ? <Text>Error: {this.state.error}</Text> : null}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   justifyContent: 'center',
  },
  messages: {
    flex: 0.8,
    backgroundColor: 'powderblue'
  },
  buttonContainer: {
    margin: 20
  },
  alternativeLayoutButtonContainer: {
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
})

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => ButtonBasics);
