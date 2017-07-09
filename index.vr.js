import React from 'react'
import {
  AppRegistry,
  asset,
  Pano,
  Text,
  View,
  Video,
  MediaPlayerState,
  Image,
  Animated
} from 'react-vr'
import axios from 'axios'

var adStyle = {
  flexDirection: 'row',
  layoutOrigin: [.5, .5],
  margin: 0.1,
  width: 3.0, 
  height: 2.0,
  transform: [{translate: [-1.7, 1.5, -5]}],
  display: 'none',
}

var contentStyle = {
  layoutOrigin: [.5, .5],
  width: 5.0, 
  height: 3.0,
  transform: [{translate: [0, 2.5, -4]}]
}

var barStyle = {
  layoutOrigin: [.5, .5],
  width: 4.0, 
  height: 0.2,
  transform: [{translate: [0, 2.5, -4]}],
  display: 'none',
}

export default class WelcomeToVR extends React.Component {
  constructor() {
    super()
    this.state = {
      urls: [],
      mainUrl: 'bond.mp4',
      loadingUrl: 'loading.mp4',
      adTimes: [5000, 5000], //millseconds of video to play between ads
      contentPlayerState: new MediaPlayerState({autoPlay: false, muted: false}),
      loadingPlayerState: new MediaPlayerState({autoPlay: false, muted: false}),
      adPlayerState: new MediaPlayerState({autoPlay: false, muted: false}),
      adStyles: [adStyle,adStyle,adStyle,adStyle],
      contentStyle: contentStyle,
      barStyle: barStyle,
      entered: null,
      consecutiveFocuses: 0,
      numTensOfMilliseconds: 12,
      slideValue: new Animated.Value(1.5),
      adIndex: 0
    }
  }

  componentDidMount() {
    var self = this

    var delay = 5000

    Animated.timing(
      self.state.slideValue,
      {
        toValue: -1.8,
        duration: delay
      }
    ).start()

    var encodeURI = window.encodeURI('http://localhost:3030/ad-names')
    axios.get(encodeURI).then(function (response) {
      self.setState({urls:response.data})
      setTimeout(() => {
        setTimeout(() => {
          self.showAds()
        }, self.state.adTimes[self.state.adIndex])
        self.state.contentPlayerState.play()
      }, delay)
    })
  }

  showAds = () => {
    this.state.contentPlayerState.pause()
    this.setState({contentStyle: Object.assign({},this.state.contentStyle,{display:'none'})})

    this.state.adPlayerState.play()
    var adStyles = this.state.adStyles.map((adStyle) => Object.assign({},adStyle,{display:'flex'}))
    this.setState({adStyles})  
    this.showBar()
  }

  hideAdsForContent = () => {
    this.hideBar()
    this.setState({adIndex: this.state.adIndex+1})
    if (this.state.adIndex < this.state.adTimes.length) {
      setTimeout(() => {
        this.showAds()
      }, this.state.adTimes[this.state.adIndex])
    }

    this.setState({adStyles: this.state.adStyles.map((adStyle) => Object.assign({},adStyle,{
      width: 3.0, 
      height: 2.0, 
      layoutOrigin: [.5, .5], 
      display:'none', 
      transform: [{
        translate: [-1.7, 1.5, -5]
      }]
    }))})
    this.setState({contentStyle: Object.assign({},this.state.contentStyle,{display:'flex'})})

    this.state.adPlayerState.pause()
    setTimeout(() => {
      this.state.contentPlayerState.play()  
    }, 500)
    
  }

  expandAd = (idx) => {
    this.hideBar()
    var adStyles = this.state.adStyles.map((adStyle, currIdx) => {
      if (currIdx == idx) {
        return Object.assign({}, this.state.adStyles[currIdx], {width: 5.0, height: 3.0, transform: [{translate: [0, .5, -4]}]})
      } else {
        return Object.assign({}, this.state.adStyles[currIdx], {display:'none'})
      }
    })
    this.setState({adStyles})
  }

  hideBar = () => {
    this.setState({barStyle:Object.assign({},this.state.barStyle,{display:'none'})})
  }
  showBar = () => {
    this.setState({barStyle:Object.assign({},this.state.barStyle,{display:'flex'})})
  }

  setEntered = (idx) => {
    this.setState({entered: idx})
    setTimeout(() => this.state.loadingPlayerState.play(), 100)
    setTimeout(() => {
      this.checkStillFocused(idx)
    }, 100)
  }

  checkStillFocused = (idx) => {
    if (this.state.entered == idx) {
      this.setState({consecutiveFocuses:this.state.consecutiveFocuses+1})
      setTimeout(() => {
        this.checkStillFocused(idx)
      }, 100)
    } else {
      this.setState({consecutiveFocuses:0})
      this.state.loadingPlayerState.pause()
      this.state.loadingPlayerState.seekTo(0)
    }
    if (this.state.consecutiveFocuses > this.state.numTensOfMilliseconds) {
      this.expandAd(idx)
    }
  }

  render() {
    var adsToDisplay = this.state.urls.slice(0,this.state.urls.length)
    var firstAds = adsToDisplay.slice(0,adsToDisplay.length/2)
    var secondAds = adsToDisplay.slice(adsToDisplay.length/2,adsToDisplay.length)

    return (
      <View>
        <Pano source={asset('theater.jpg')} onInput={() => {}}/>

        <Animated.View 
          style={{
            transform: [
              {translateY: this.state.slideValue}
            ]
          }}>
          <Video
            source={asset(this.state.mainUrl)} 
            style={this.state.contentStyle}
            playerState={this.state.contentPlayerState}
          />
        </Animated.View>

        <View>
          <View style={{flexDirection: 'row'}}>
          {
            firstAds.map((url, idx) => {
              return (
                <View key={url}>
                  <Video
                    onEnter={() => this.setEntered(idx)}
                    onExit={() => {this.setState({entered: null})}}
                    source={asset(url)} 
                    style={this.state.adStyles[idx]}
                    onEnded={this.hideAdsForContent}
                    playerState={this.state.adPlayerState}
                  />
                </View>
              )
            })
          }
          </View>

        <View>
          <Video
            source={asset(this.state.loadingUrl)} 
            style={this.state.barStyle}
            playerState={this.state.loadingPlayerState}
          />
        </View>

          <View style={{flexDirection: 'row'}}>
          {
            secondAds.map((url, idx) => {
              idx += 2
              return (
                <View key={url}>
                  <Video
                    onEnter={() => this.setEntered(idx)}
                    onExit={() => {this.setState({entered: null})}}
                    source={asset(url)} 
                    style={this.state.adStyles[idx]}
                    onEnded={this.hideAdsForContent}
                    playerState={this.state.adPlayerState}
                  />
                </View>
              )
            })
          }
          </View>
        </View>
        
      </View>
    )
  }
}

AppRegistry.registerComponent('WelcomeToVR', () => WelcomeToVR)
