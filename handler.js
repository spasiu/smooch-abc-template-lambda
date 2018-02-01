const co = require('co');
const smooch = require('./lib/smooch');
const abc = require('./lib/abc');
const triggers = require('./config/triggers');
const config = require('./config');
const colorPickerTemplate = require('./templates/color.json');
const patternPickerTemplate = require('./templates/pattern.json');
const stylePickerTemplate = require('./templates/style.json');

const templates = {
    'color.json': colorPickerTemplate,
    'pattern.json': patternPickerTemplate,
    'style.json': stylePickerTemplate
};

module.exports.endpoint = (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const body = JSON.parse(event.body);

    if (body.trigger === 'message:appMaker') {
        const secret = config.smoochEventWebhookSecret;
        if (secret && secret !== req.headers['x-api-key']) return;
        co(function* () {
            try {
                for (const message of body.messages) {
                    for (const trigger of triggers) {
                        if (message.text.indexOf(trigger.phrase) !== -1) {
                            const data = templates[trigger.payload];
                            const appUserId = body.appUser._id;
                            const payload = yield abc.getPayload(data);
                            yield smooch.appUsers.sendMessage(appUserId, {
                                text: `Sending listpicker [${data.receivedMessage.title}]`,
                                override: { apple: { payload }},
                                role: 'appMaker'
                            });
                        }
                    }
                }
            } catch(error) {
                console.log('abcEventHanlder ERROR\n', error && error.response && error.response.data || error);
            }

            context.succeed({ statusCode: 200 });
        }).catch(err => {
            console.log('ERROR in Smooch handler', error);
            context.succeed({ statusCode: 200 });
        });
    }

    if (body.trigger === 'passthrough:apple:interactive') {
        const secret = config.abcEventWebhookSecret;
        if (secret && secret !== req.headers['x-api-key']) return;
        co(function* () {
            try {
                const payload = yield abc.getResponse(body.payload.apple.interactiveDataRef);
                const text = payload.data.listPicker.sections[0].items
                .map(item => item.title)
                .join(' and ');

                yield smooch.appUsers.sendMessage(body.appUser._id, {
                    role: 'appUser', type: 'text', text
                });
            } catch (error) {
                console.log('abcEventHanlder ERROR\n', error && error.response && error.response.data || error);
            }

            context.succeed({ statusCode: 200 });
        }).catch(err => {
            console.log('ERROR in ABC handler', error);
            context.succeed({ statusCode: 200 });
        });
    }
};
