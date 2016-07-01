import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Projects } from './projects';
import { Issues } from './issues';

export const History = new Mongo.Collection('history');

Meteor.methods({
    'history.insert'(project, countPerStates, countPerTrackers, countPerPriority, countPerSeverity) {
        check(project, String);

        let entry = {};
        let today = moment(new Date()).format("YYYY-MM-DD");

        entry['countPerStates'] = {};
        entry['countPerStates'][today] = countPerStates;

        entry['countPerTrackers'] = {};
        entry['countPerTrackers'][today] = countPerTrackers;

        entry['countPerPriority'] = {};
        entry['countPerPriority'][today] = countPerPriority;

        entry['countPerSeverity'] = {};
        entry['countPerSeverity'][today] = countPerSeverity;

        History.insert({
                project: project,
                data: entry,
        });
    },
    'history.update'(project, countPerStates, countPerTrackers, countPerPriority, countPerSeverity) {
        check(project, String);
        let history = History.findOne({'project': project});
        let today = moment(new Date()).format("YYYY-MM-DD");

        history.data['countPerStates'][today] = countPerStates;
        history.data['countPerTrackers'][today] = countPerTrackers;
        history.data['countPerPriority'][today] = countPerPriority;
        history.data['countPerSeverity'][today] = countPerSeverity;

        History.update({project: project}, {
            $set: {
                'data': history.data,
            }
        });
    }
});
