const express = require('express')
const { Card } = require('dialogflow-fulfillment')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const axios = require('axios')
const PORT = 3001
const logger = require('./middleware')
require('dotenv').config()

// setings
app.use(logger)
app.use(express.json())

// get index
app.get('/', (req, res) => {
  res.send('Server is Working')
})

// GET nextRace data
const dataNextRace = []
axios.get('https://ergast.com/api/f1/2022/next.json')
  .then(response => {
    const race = (response.data.MRData.RaceTable.Races)
    race.forEach(race => {
      dataNextRace.push(race)
    })
    dataNextRace.forEach(race => {
      const dateTimeFixed = new Date(race.date + 'T' + race.time)
      const dataTime = (dateTimeFixed.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' }))
      const [date, time] = dataTime.split(',')
      race.date = date
      race.time = time
    })
  })

// GET Races data
const dataCircuits = []
const menssageAllRaces = []
axios.get('https://ergast.com/api/f1/2022.json')
  .then(response => {
    const races = (response.data.MRData.RaceTable.Races)
    races.forEach(race => {
      dataCircuits.push(race)
    })
    dataCircuits.forEach(circuit => {
      const dateTimeFixed = new Date(circuit.date + 'T' + circuit.time)
      const dataTime = (dateTimeFixed.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' }))
      const [date, time] = dataTime.split(',')
      circuit.date = date
      circuit.time = time
    })
    dataCircuits.forEach(circuit => {
      const AllRaces = (`${circuit.round} - ${circuit.raceName} en el ${circuit.Circuit.circuitName} el dia  *${circuit.date}* a las ${circuit.time}hs`)
      menssageAllRaces.push(AllRaces)
    })
  })

// GET Drivers data
const dataDrivers = []
const menssageAllDrivers = []
axios.get('https://ergast.com/api/f1/2022/driverStandings.json')
  .then(response => {
    const drivers = (response.data.MRData.StandingsTable.StandingsLists)
    const driversStandings = drivers.map(driver => driver.DriverStandings)
    driversStandings.map(driver => {
      driver.forEach(driver => {
        dataDrivers.push(driver)
      })
      return dataDrivers
    })
    dataDrivers.forEach(driver => {
      const AllDrivers = (`${driver.position} ° ${driver.Driver.givenName} ${driver.Driver.familyName} - ${driver.points} pts.`)
      menssageAllDrivers.push(AllDrivers)
    })
  })

// GET Construcors data
const dataConstructors = []
const menssageAllConstrucors = []
axios.get('https://ergast.com/api/f1/2022/constructorStandings.json')
  .then(response => {
    const constructors = (response.data.MRData.StandingsTable.StandingsLists)
    const constructorsStandings = constructors.map(constructor => constructor.ConstructorStandings)
    constructorsStandings.map(constructor => {
      constructor.forEach(constructor => {
        dataConstructors.push(constructor)
      })
      return dataConstructors
    })
    dataConstructors.forEach(constructor => {
      const AllConstructors = (`${constructor.position}° ${constructor.Constructor.name} - ${constructor.points} pts.`)
      menssageAllConstrucors.push(AllConstructors)
    })
  })

// GET allResuls data
const allResuls = []
axios.get('http://ergast.com/api/f1/2022/results.json?limit=300')
  .then(response => {
    const Races = (response.data.MRData.RaceTable.Races)
    Races.forEach(race => {
      allResuls.push(race)
    })
  })

// GET lastRace data
const lastRacedata = []
const menssageLastRace = []
axios.get('https://ergast.com/api/f1/2022/last/results.json')
  .then(response => {
    const lastRace = (response.data.MRData.RaceTable.Races)
    const result = lastRace.map(race => race.Results)
    result.forEach(result => {
      result.forEach(result => {
        lastRacedata.push(result)
      })
      lastRacedata.forEach(result => {
        const allResuls = (`${result.position} ° ${result.Driver.givenName} ${result.Driver.familyName} (${result.Constructor.name})  ${result.points} pts.`)
        menssageLastRace.push(allResuls)
      })
    })
  })

// post Webhook
app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })
  console.log('------------------------------------------------')
  console.log('Webhook request headers')
  console.log(JSON.stringify(req.headers, 2, ' '))
  console.log('------------------------------------------------')
  console.log('Webhook request body')
  console.log(JSON.stringify(req.body, 2, ' '))
  console.log('------------------------------------------------')

  // function fallback
  function fallback (agent) {
    agent.add('I didn\'t understand')
    agent.add('I\'m sorry, can you try again?')
  }

  // function welcome
  function Welcome (agent) {
    agent.add(new Card({
      title: 'Bienvenido al Bot de la F1 2022',
      text: 'En que puedo ayudarte?',
      imageUrl: 'https://e00-marca.uecdn.es/assets/multimedia/imagenes/2022/08/02/16594437387157.jpg'
    }))
  }

  // function allRaces intent
  function allRaces (agent) {
    const menssageAllRacestext = menssageAllRaces.join('\n')
    agent.add(new Card({
      title: 'Este año hay ' + dataCircuits.length + ' GP 🏁, los cuales son:',
      text: menssageAllRacestext
    }))
  }

  // function nextRaces intent
  function nextRace (agent) {
    return dataNextRace.forEach(race => {
      agent.add(new Card({
        title: `${race.raceName}`,
        text: `En el ${race.Circuit.circuitName} el dia ${race.date} a las ${race.time}hs`,
        imageUrl: 'https://s3-eu-west-1.amazonaws.com/racingnews-v2-prod/_1125x633_crop_center-center_85_none/thumbnail_2020circuitaerien_paysage.jpeg?v=1646231138',
        buttonText: 'Ver detalles',
        buttonUrl: 'https://es.wikipedia.org/wiki/Circuito_de_Spa-Francorchamps'
      }))
    })
  }

  // function allDrivers intent
  function allDrivers (agent) {
    const menssageAllDriverstext = menssageAllDrivers.join('\n')
    agent.add(new Card({
      title: 'Tabla de Pilotos de la F1 2022 🏆',
      text: menssageAllDriverstext
    }))
  }

  // function driverStanding intens
  function driverStanding (agent) {
    if (agent.parameters.Piloto) {
      const driverName = agent.parameters.Piloto
      const driverStanding = dataDrivers.find(driver => driver.Driver.driverId === driverName)
      const menssage = (`${driverStanding.Driver.givenName} ${driverStanding.Driver.familyName} se encunetra en la ${driverStanding.position}° posicion 🎖 con ${driverStanding.points} pts.`)
      agent.add(menssage)
    } else {
      agent.add('Por favor, dime el nombre de un piloto o escuderia correcto')
    }
  }

  // function allConstructors intent
  function allConstructors (agent) {
    const menssageAllConstrucorsText = menssageAllConstrucors.join('\n')
    agent.add(new Card({
      title: 'Tabla de Construcores de la F1 2022 🏆',
      text: menssageAllConstrucorsText
    }))
  }
  // function constructorStandings intent
  function constructorStandings (agent) {
    if (agent.parameters.Constructores) {
      const constructorName = agent.parameters.Constructores
      const constructorStanding = dataConstructors.find(constructor => constructor.Constructor.constructorId === constructorName)
      agent.add(`${constructorStanding.Constructor.name} se encunetra en la ${constructorStanding.position}° posicion 🎖 con ${constructorStanding.points} pts.`)
    } else {
      agent.add('Por favor, dime el nombre de un piloto o escuderia correcto')
    }
  }

  // function RaceResult intent
  function RaceResult (agent) {
    if (agent.parameters.Circuitos) {
      const circuitName = agent.parameters.Circuitos
      const RaceResultName = allResuls.find(raceName => raceName.Circuit.circuitId === circuitName)
      if (RaceResultName) {
        const RaceResultData = RaceResultName.Results
        const menssageRaceResult = []
        const menssageRaceName = RaceResultName.raceName
        RaceResultData.forEach(raceResult => {
          const RaceResult = (`${raceResult.position}° ${raceResult.Driver.givenName} ${raceResult.Driver.familyName} (${raceResult.Constructor.name}) - ${raceResult.points} pts ${raceResult.status}`)
          menssageRaceResult.push(RaceResult)
        }
        )
        const menssageRaceResultText = menssageRaceResult.join('\n')
        agent.add(new Card({
          title: `Resultados de el ${menssageRaceName} 🏆`,
          text: menssageRaceResultText
        }))
      } else {
        agent.add('Aun no hay resultados de este circuito ⌛')
        console.log(RaceResultName)
      }
    } else {
      agent.add('No he podido encontrar el circuito que buscas')
    }
  }

  // funcion lastRaceResult intent
  function lastRaceResult (agent) {
    const menssageLastRaceResulttext = menssageLastRace.join('\n')
    agent.add(new Card({
      title: 'Resultados de la última carrera de la F1 2022 🏆',
      text: menssageLastRaceResulttext
    }))
  }
  // function driverRaceResult intent
  function driverRaceResult (agent) {
    const circuitName = agent.parameters.Circuitos
    const circuitNameData = allResuls.find(raceName => raceName.Circuit.circuitId === circuitName)
    const driverRaceResultNames = circuitNameData.Results.map(raceResult => raceResult.Driver)
    console.log(driverRaceResultNames)
    agent.add('Prueba')
  }
  const intentMap = new Map()
  intentMap.set('Default Fallback Intent', fallback)
  intentMap.set('Welcome', Welcome)
  intentMap.set('allDrivers', allDrivers)
  intentMap.set('driverStanding', driverStanding)
  intentMap.set('allRaces', allRaces)
  intentMap.set('nextRace', nextRace)
  intentMap.set('allConstructors', allConstructors)
  intentMap.set('constructorStandings', constructorStandings)
  intentMap.set('RaceResult', RaceResult)
  intentMap.set('lastRaceResult', lastRaceResult)
  intentMap.set('driverRaceResult', driverRaceResult)
  agent.handleRequest(intentMap)
})

// status code 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// starting the server
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
  console.log(process.env.API_URL)
})
