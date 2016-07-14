import { Projects } from './projects';

parseCustomFieldRows = function (projectName) {
    var customFields = Projects.findOne({'name': projectName}).customFields;
    var customFieldsRowsArray = [];

    if (customFields) {

        if ((Object.keys(customFields).length % 2) != 0) {
            customFields.aligner = void 0;
        }

        var row = void 0;
        for (var key in customFields) {
            var obj = void 0;
            var index = Object.keys(customFields).indexOf(key);

            if (key.indexOf('input_') == 0) {
                obj = {
                    type: 'input',
                    name: key,
                    title: customFields[key].title
                };
            } else if (key.indexOf('select_') == 0) {
                var options = customFields[key].options.split(',');

                for (var i = 0; i < options.length; i++) {
                    options[i] = options[i].replace(/^\s+/, '');
                }
                obj = {
                    type: 'select',
                    name: key,
                    title: customFields[key].title,
                    options: options
                };
            } else {
                obj = customFields.aligner;
            }

            customFieldsRowsArray.push(obj);
        }
    }

    return (customFieldsRowsArray);
}
