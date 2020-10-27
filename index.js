/*

Example middleware in Javascript

This middleware provides the minimal implementation 

*/

/*
Import serialization / deserialization via quicktype.
Use *toJson* functions to turn response objects into JSON before sending response

Quicktype file was created from source code in the pluginmessages directory with the following command
quicktype -l javascript --src-lang schema schema/*.json > lang/quicktype.js

Can copy and paste quicktype.js into this directory. Remove this if quicktype is not desired.
*/

const Convert = require("./quicktype")


/*
Set up simple node server to receive Plaid messages.
Note that this does not include error checking, security, etc.
*/


const http = require("http")
const port = 4000

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log("error starting server", err)
  }

  console.log(`server is listening on ${port}`)
})

/*
SUPPORT FUNCTIONS
*/

function requestHandler(request, response) {
  let receivedData = ""

  if (request.method === "POST") {
    request.on("data", (data) => {
      receivedData += String(data)
    })
    request.on("end", () => {
      parseMessage(response, receivedData)
    })
  } else {
    response.writeHead(400)
    response.write("Only POST allowed")
    response.end()
  }
}

function createErrorResponse(response) {
  response.writeHead(500)
  response.write("An error occurred")
  response.end()
}

function parseMessage(response, data) {
  try {
    const payload = JSON.parse(data)
    const messageType = payload.header.messageType
    createResponse(response, messageType, payload)
  } catch (e) {
    console.error(e)
    createErrorResponse(response)
  }
}

function createResponse(response, messageType, payload) {
  console.log(`Message of type ${messageType} received`)
  if (messageType === "OnRegisterReports") onRegisterReportsMessage(response)
  else if (messageType === "OnQueryIntervals") onQueryIntervalsMessage(response, payload)
  else if (messageType === "OnEventIntervalStart")
    startEventInterval(response, payload.onEventIntervalStartMessage)
  else if (messageType === "OnEventComplete") endEvent(response, payload.onEventCompleteMessage)
  else if (messageType === "OnError") genericResponse("error", response, payload.onErrorMessage)
  else {
    console.log(`Message of type ${messageType} received, not handled`)
    response.writeHead(400)
    response.write("Message type not supported")
    response.end()
  }
}

/*

This function responds to the OnRegisterReports callback 
with the standard report types required for OpenADR compliance

*/

function onRegisterReportsMessage(response) {
  const registerReportsResponse = {
    onRegisterReportsResponseMessage: {
      telemetryReports: [
        {
          duration: {
            duration: 60,
            durationModifier: "M",
          },
          reportSpecifierId: "TELEMETRY_USAGE",
          reportName: "TELEMETRY_USAGE",
          intervalDescriptions: [
            {
              rid: `POWER`,
              samplingPeriod: {
                maxSamplingPeriod: 1,
                minSamplingPeriod: 1,
                samplingPeriodModifier: "M",
                onChange: false,
              },
              marketContext: "http://MarketContext1",
              resourceId: "",
              usageIntervalProperties: {
                readingType: "Direct Read",
                reportType: "usage",
                units: {
                  description: "RealPower",
                  siScaleCode: "none",
                  units: "W",
                  unitType: "POWER_REAL",
                },
              },
            },
            {
              rid: `ENERGY`,
              samplingPeriod: {
                maxSamplingPeriod: 1,
                minSamplingPeriod: 1,
                samplingPeriodModifier: "M",
                onChange: false,
              },
              marketContext: "http://MarketContext1",
              resourceId: "",
              usageIntervalProperties: {
                readingType: "Direct Read",
                reportType: "usage",
                units: {
                  description: "RealEnergy",
                  siScaleCode: "none",
                  units: "Wh",
                  unitType: "ENERGY_REAL",
                },
              },
            },
          ],
        },
        {
          duration: {
            duration: 60,
            durationModifier: "M",
          },
          reportSpecifierId: "TELEMETRY_STATUS",
          reportName: "TELEMETRY_STATUS",
          intervalDescriptions: [
            {
              rid: "STATUS",
              samplingPeriod: {
                maxSamplingPeriod: 1,
                minSamplingPeriod: 1,
                samplingPeriodModifier: "M",
                onChange: false,
              },
              marketContext: "http://MarketContext1",
              resourceId: "",
            },
          ],
        },
      ],
    },
  }

  const jsonResponseBody = Convert.onRegisterReportsResponseToJson(registerReportsResponse)

  response.writeHead(200, { "Content-Type": "application/json" })
  response.write(jsonResponseBody)
  response.end()
}

/*

This function responds to the OnQueryIntervals callback 
with dummy data (0 data is fine for compliance)

*/

function onQueryIntervalsMessage(response, message) {
  const onQueryIntervalsMessage = message.onQueryIntervalsMessage
  console.log(onQueryIntervalsMessage)

  const startTime = onQueryIntervalsMessage.startTimet
  const endTime = onQueryIntervalsMessage.endTimet
  const granularity = onQueryIntervalsMessage.granularityInSeconds

  let numIntervals

  if(granularity === 0 || (endTime - startTime) === 0) numIntervals = 1
  else {
    numIntervals = 1 + (endTime - startTime) / granularity
  }

  const rIds = onQueryIntervalsMessage.rIds

  let reportIntervals = []
  let dtStartTimet = startTime

  for(let i = 0; i < numIntervals; i++){
    for(let j = 0; j < rIds.length; j++){
      const rId = rIds[j]
      reportIntervals.push({
        dataQuality: "Quality Good - Non Specific",
        dtStartTimet,
        rId,
        value: 0,
      })
    }
    dtStartTimet += granularity
  }


  const queryIntervalsResponse = {
    onQueryIntervalsResponseMessage: {
      reports: [{ reportIntervals }],
    },
  }

  const jsonResponseBody = Convert.onQueryIntervalsResponseToJson(queryIntervalsResponse)

  response.writeHead(200, { "Content-Type": "application/json" })
  response.write(jsonResponseBody)
  response.end()
}

/*

Dummy startEventInterval function. Add in logic to update your system accordingly.

*/

function startEventInterval(response, eventData) {
  console.log(`StartEventInterval message received:`)
  console.log(eventData)

  //Put your logic here

  response.writeHead(200)
  response.end()
}

/*

Dummy endEvent function. Add in logic to update your system accordingly.

*/

function endEvent(response, eventData) {
  console.log(`OnEventComplete message received:`)
  console.log(eventData)

  //Put your logic here

  response.writeHead(200)
  response.end()
}



/*

Generic response - does some logic and responds blank

*/

function genericResponse(type, response, messageContent) {
  console.log(`${type} message`)
  console.log(messageContent)
  response.writeHead(200)
  response.end()
}
