# Nexmo SMS API Throttler

An example of throttling Nexmo SMS API requests based on a combination of account limits (30 API requests per minute) and limitations of the number of SMS that can be sent from a given number.

See the [throughput FAQ](https://help.nexmo.com/hc/en-us/articles/203993598-What-is-the-Throughput-Limit-for-Outbound-SMS-) for more information on API and country limits.

The throttling mechanism is built upon the [bottleneck Node library](https://github.com/SGrondin/bottleneck). The default account level throttler allows for **30 SMS API requests per second**. The number level throttler is configured to allow **250 SMS per number per day**. See [Configuring the throttles](#configuring-the-throttles) for details on how to customise further.

## Running the example

Install dependencies:

```sh
npm install
```

Create a `.env`:

```sh
touch .env
```

Add the required values:

```
NEXMO_API_KEY=YOUR_NEXMO_API_KEY
NEXMO_API_SECRET=YOUR_NEXMO_API_SECRET
FROM_NUMBER=14155550125
TO_NUMBERS=14155550123,14155550124
DEBUG=true
```

Run the example:

```sh
node example/index.js
```

## Example Usage

```js
const SMSThrottler = require('./src/SMSThrottler')
const Nexmo = require('nexmo')

// Create Nexmo instance for your account
const nexmo = new Nexmo({
    apiKey: NEXMO_API_KEY,
    apiSecret: NEXMO_API_SECRET
})

// Create a throttler instance and pass in a Nexmo instance
// that has been set up with account credentials
const throttler = new SMSThrottler({
    nexmoInstance: nexmo
});

// Function to handle callbacks for SMS API requests
function completed(err, result) {
    if(err) {
        console.error(err)
    }
    else {
        console.log('completed', result)
    }
}

// Example of using the throttler to queue requests
const message = 'This is a test message to be sent to all numbers'
const toNumbers = ['14155550123', '14155550124']
for(let i = 0, l = toNumbers.length; i < l; ++i) {
    // This example sends from only one nunmber although the SMSThrottler supports throttling
    // for more than one number. To utilise this functionality you should update this code
    // to use multiple "from" numbers.
    throttler.queue({from: '14155550125', text: message, to: toNumbers[i], callback: completed})
}
```

## Configuring the throttlers

Further customisation, including clustering, can be achieved by configuring the underlying account and number limiters. This is achieved by passing in the options defined in the [bottleneck docs](https://github.com/SGrondin/bottleneck#constructor).

The options are passed to the `SMSThrottler` constructor:

```js
new SMSThrottler({
    nexmoInstance: nexmo,
    accountOptions: options,
    numberOptions: options
})
```

## License

MIT