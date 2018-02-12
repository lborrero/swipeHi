import React, { Component } from 'react';
import {Text, Alert, AppRegistry, Button, StyleSheet, View } from 'react-native';


class Greeting extends Component {
  render() {
    return (
      <Text>Heasdfllo {this.props.name}!</Text>
    );
  }
}

export default class ButtonBasics extends Component {
  constructor(props){
    super(props);
    this.state = {
      numberOfMessages: 10,
      thisisTrue: true
    }
  }

  _onPressButton() {
    this.setState({
      thisisTrue: false
    });
    Alert.alert('You tapped the button!' + this.state.numberOfMessages)
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
