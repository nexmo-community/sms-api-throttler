// Restrictions:
// - 30 SMS API calls per second per account
// - 1 per second per number
// - 250 maximum per day for a single number

const SMSThrottler = require('../src/SMSThrottler')
const Nexmo = require('nexmo')
const config = require('dotenv').config()

const NEXMO_API_KEY = process.env.NEXMO_API_KEY
const NEXMO_API_SECRET = process.env.NEXMO_API_SECRET
const DEBUG = process.env.DEBUG
const FROM_NUMBER = process.env.FROM_NUMBER
const toNumbers = process.env.TO_NUMBERS.split(',') // convert to an Array of numbers to send to

const errors = []
if(!FROM_NUMBER) {
    errors.push('FROM_NUMBER must be set in ".env"')
}
if(!toNumbers || toNumbers.length === 0) {
    errors.push('TO_NUMBERS must be set in ".env"')
}
if(errors.length) {
    console.error(errors)
    return
}

// Create Nexmo instance for your account
const nexmo = new Nexmo({
    apiKey: NEXMO_API_KEY,
    apiSecret: NEXMO_API_SECRET
}, {debug: DEBUG})

// Create a throttler instance and pass in a Nexmo instance
// that has been set up with account credentials
const throttler = new SMSThrottler({
    nexmoInstance: nexmo,
    debug: DEBUG
});

// Function to handle callbacks for SMS API requests
function completed(err, result) {
    if(err) {
        console.error(err)
    }
    else {
        console.log('completed', result, 'account limiter count', throttler.accountLimiter.counts())
        console.log('droppedCount', throttler.droppedCount)
    }
}

// Example of using the throttler to queue requests
const message = 'This is a test message to be sent to all numbers'
for(let i = 0, l = toNumbers.length; i < l; ++i) {
    // This example sends from only one nunmber although the SMSThrottler supports throttling
    // for more than one number. To utilise this functionality you should update this code
    // to use multiple "from" numbers.
    throttler.queue({from: FROM_NUMBER, text: message, to: toNumbers[i], callback: completed})
}