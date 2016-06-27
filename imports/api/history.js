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

        entry['countPerStates'] = {};
        entry['countPerStates'][moment(new Date()).format("YYYY-MM-DD")] = countPerStates;

        entry['countPerTrackers'] = {};
        entry['countPerTrackers'][moment(new Date()).format("YYYY-MM-DD")] = countPerTrackers;

        entry['countPerPriority'] = {};
        entry['countPerPriority'][moment(new Date()).format("YYYY-MM-DD")] = countPerPriority;

        entry['countPerSeverity'] = {};
        entry['countPerSeverity'][moment(new Date()).format("YYYY-MM-DD")] = countPerSeverity;

        History.insert({
                project: project,
                data: entry,
        });
    },
    'history.update'(project, countPerStates, countPerTrackers, countPerPriority, countPerSeverity) {
        check(project, String);
        let history = History.findOne({'project': project});
        // history.data[moment(new Date()).format("YYYY-MM-DD")] = {
        //     countPerStates: [countPerStates],
        //     countPerTrackers: [countPerTrackers],
        //     countPerPriority: [countPerPriority],
        //     countPerSeverity: [countPerSeverity],
        // };
        //
        // History.update({project: project}, {
        //         $set: {
        //             'data': history.data,
        //         }
        // });
    }
});
