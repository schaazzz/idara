import '../imports/api/users.js';
import '../imports/api/projects.js';
import '../imports/api/issues.js';
import '../imports/api/comments.js';
import '../imports/api/workflows.js';
import '../imports/api/files.js';
import '../imports/api/history.js';

import {Projects} from '../imports/api/projects';
import {Issues} from '../imports/api/issues';
import {History} from '../imports/api/history';

let countPerStates = {};
let countPerTrackers = {};
let countPerPriority = {};
let countPerSeverity = {};

const trackerList = ['Defect', 'Change Request', 'Enhancement', 'Question'];
const priorityList = ['Very Low', 'Low', 'Mid', 'High', 'Very High' ];
const severityList = ['Cosmetic', 'Minor', 'Moderate', 'Major', 'Critical'];

function updateHistory() {
    console.log('==========> updateHistory()');
    let projects = Projects.find().fetch();
    projects.forEach(parseProject);
}

var cron = new Meteor.Cron({
    events: {
        "15 00 * * *"  : updateHistory,
        "15 06 * * *"  : updateHistory,
        "15 14 * * *"  : updateHistory,
        "15 12 * * *"  : updateHistory,
        "15 18 * * *"  : updateHistory,
    }
});

function parseProject(element, index, array) {
    var workflow = element.workflow;

    for (let state of workflow) {
        let issues = Issues.find({'project': element.name, 'state': state.stateName});

        if (issues) {
            countPerStates[state.stateName] = issues.count();
        } else {
            countPerStates[state.stateName] = 0;
        }
    }

    for (let tracker of trackerList) {
        let issues = Issues.find({'project': element.name, 'tracker': tracker, 'state': {$ne: 'Closed'}});

        if (issues) {
            countPerTrackers[tracker] = issues.count();
        } else {
            countPerTrackers[tracker] = 0;
        }
    }

    for (let priority of priorityList) {
        let issues = Issues.find({'project': element.name, 'priority': priority, 'state': {$ne: 'Closed'}});

        if (issues) {
            countPerPriority[priority] = issues.count();
        } else {
            countPerPriority[priority] = 0;
        }
    }

    for (let severity of severityList) {
        let issues = Issues.find({'project': element.name, 'severity': severity, 'state': {$ne: 'Closed'}});

        if (issues) {
            countPerSeverity[severity] = issues.count();
        } else {
            countPerSeverity[severity] = 0;
        }
    }

    let history = History.findOne({'project': element.name});
    if (history) {
        Meteor.call('history.update', element.name, countPerStates, countPerTrackers, countPerPriority, countPerSeverity);
    } else {
        Meteor.call('history.insert', element.name, countPerStates, countPerTrackers, countPerPriority, countPerSeverity);
    }
}
