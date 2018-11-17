var assert = require('assert');

const SMSThrottler = require('../src/SMSThrottler')

function createNexmo() {
    return {
        message: {
            sendSms: () => {
                // console.log('nexmo.message.sendSms', arguments)
            }
        }
    }
}

function createThrottler(nexmo = createNexmo(), accountOptions = {
    minTime: 0,
    maxConcurrent: null,
    reservoir: 5,
    reservoirRefreshAmount: 5,
    reservoirRefreshInterval: 1 * 1000,
    trackDoneStatus: true
}) {
    return new SMSThrottler({
        nexmoInstance: nexmo,
        accountOptions: accountOptions
    })
}

const nullCallback = () => {}

describe('SMSThrottler', () => {

  describe('#queue()', () => {
    
    it('should call nexmo.message.sendSms', (done) => {
        const nexmo = createNexmo()
        nexmo.message.sendSms = () => {
            done()
        }

        const throttler = createThrottler(nexmo);
        throttler.queue({from: '0000000', text: 'message', to: '1111111', callback: nullCallback})
    })

    it('should create a new limiter for each "from" number', () => {
        const throttler = createThrottler();
        throttler.queue({from: '0000000', text: 'message', to: '1111111', nullCallback})
        throttler.queue({from: '0000001', text: 'message', to: '1111111', nullCallback})
        throttler.queue({from: '0000002', text: 'message', to: '1111111', nullCallback})

        assert.equal(throttler.numberLimiterGroup.keys().length, 3)
    })

    it('should dequeue a maximum of 5 SMS per second', (done) => {
        let successCallbackCount = 0
        let errorCallbackCount = 0
        let sentCount = 0

        const nexmo = createNexmo()
        nexmo.message.sendSms = (from, to, text, callback) => {
            ++sentCount
            callback(null, {})
        }

        const expectedPerSecond = 5
        const waitSeconds = 5
        const maxPerSecond = 5

        const throttler = createThrottler(nexmo, {
            minTime: 0,
            maxConcurrent: null,
            reservoir: expectedPerSecond,
            reservoirRefreshAmount: expectedPerSecond,
            reservoirRefreshInterval: 1 * 1000,
            trackDoneStatus: true
        });

        let callbackHandler = function(error, success) {
            if(error) {
                ++errorCallbackCount
            }
            if(success) {
                ++successCallbackCount
            }
        }

        for(let i = 0; i < 50; ++i) {
            throttler.queue({from: 'from' + i, to: 'to' + i, text: 'message', callback: callbackHandler})
        }

        setTimeout(() => {
            assert.equal(successCallbackCount, waitSeconds*maxPerSecond)
            done()
        }, waitSeconds*1000)
    })

  })

})