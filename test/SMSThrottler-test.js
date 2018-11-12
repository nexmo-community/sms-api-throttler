var assert = require('assert');

const SMSThrottler = require('../src/SMSThrottler')

function createNexmo() {
    return {
        message: {
            sendSMS: () => {
                console.log('nexmo.message.sendSms', arguments)
            }
        }
    }
}

function createThrottler(nexmo = createNexmo()) {
    return new SMSThrottler({
        nexmoInstance: nexmo,
        accountOptions: {
            minTime: 500,
            maxConcurrent: 10,
            reservoir: 5,
            reservoirRefreshAmount: 5,
            reservoirRefreshInterval: 10000,
            trackDoneStatus: true
        }
    })
}

const nullCallback = () => {}

describe('SMSThrottler', () => {

  describe('#queue()', () => {
    
    it('should call nexmo.message.sendSms', (done) => {
        const nexmo = createNexmo()
        nexmo.message.sendSms = () => {
            console.log('nexmo.message.sendSms called')
            done()
        }

        const throttler = createThrottler(nexmo);
        throttler.queue({from: '0000000', text: 'message', to: '1111111', callback: () => {
            console.log('a callback')
        }})
    })

    it('should create a new limiter for each "from" number', () => {
        const throttler = createThrottler();
        throttler.queue({from: '0000000', text: 'message', to: '1111111', nullCallback})
        throttler.queue({from: '0000001', text: 'message', to: '1111111', nullCallback})
        throttler.queue({from: '0000002', text: 'message', to: '1111111', nullCallback})

        assert.equal(throttler.numberLimiterGroup.keys().length, 3)
    })

  })

})