const Bottleneck = require('bottleneck')

const ACCOUNT_MAX_API_CALLS = 30
const ACCOUNT_MAX_API_CALLS_PERIOD = (60 * 1000)
const PHONE_NUMBER_MAX_SMS = 250
const PHONE_NUMBER_MAX_SMS_PERIOD = ( ( (60 * 1000) * 60 ) * 24 ) // Allow request on a daily basis

/**
 * The SMSThrottler throttles API request for an account and number.
 */
class SMSThrottler {

    /**
     * 
     * @param {Object} nexmoInstance a Nexmo instance to be used to send the SMS
     * @param {Object} accountOptions Optional. See https://github.com/SGrondin/bottleneck#constructor
     * @param {Object} numberOptions Optional. See https://github.com/SGrondin/bottleneck#constructor
     */
    constructor({
        nexmoInstance,
        accountOptions = {
            minTime: 500,
            maxConcurrent: 10,
            reservoir: ACCOUNT_MAX_API_CALLS,
            reservoirRefreshAmount: ACCOUNT_MAX_API_CALLS,
            reservoirRefreshInterval: ACCOUNT_MAX_API_CALLS_PERIOD,
            trackDoneStatus: true
        },
        numberOptions = {
            minTime: 500,
            maxConcurrent: 10,
            reservoir: PHONE_NUMBER_MAX_SMS,
            reservoirRefreshAmount: PHONE_NUMBER_MAX_SMS,
            reservoirRefreshInterval: PHONE_NUMBER_MAX_SMS_PERIOD, 
            trackDoneStatus: true
        },
        debug = false
    }) {
        this.nexmo = nexmoInstance
        this.accountLimiter = new Bottleneck(accountOptions)
        this.numberLimiterGroup = new Bottleneck.Group(numberOptions)
        this.debug = debug

        this.numberLimiterGroup.on('created', (limiter, key) => {
            limiter.chain(this.accountLimiter)

            limiter.on('error', (error) => {
                console.error(`Error with number limiter "${key}"`)
                console.error(error)
            })
        })

        this.accountLimiter.on('error', (error) => {
            console.error(error)
        })
        
        this.droppedCount = 0;
        this.accountLimiter.on('dropped', (dropped) => {
            ++this.droppedCount;
            this._log('dropped', dropped)
        })

    }

    /**
     * Queue the SMS API request
     * 
     * @param {String} from The sender ID the SMS is to be sent from. This should generally be a phone number registered with Nexmo
     * @param {String} to The phone number the SMS is to be sent to
     * @param {String} text The text of the SMS message
     * @param {Function} callback The callback function to be invoked when the SMS API request has completed
     */
    queue({from, to, text, callback}) {
        this._log(`queuing "${from}" -> "${to}" "${text}"`, 'limiter count', this.accountLimiter.counts())

        // Ensure limits are tracked on a per-number basis by using a group limiter
        this.numberLimiterGroup.key(from).submit(this._sendSms.bind(this), from, to, text, callback)
    }

    /**
     * @private
     */
    _sendSms(from, to, text, callback) {
        this.nexmo.message.sendSms(from, to, text, callback);
    }

    /**
     * @private
     */
    _log() {
        if(this.debug) {
            console.log.apply(null, arguments)
        }
    }
    
}

module.exports = SMSThrottler