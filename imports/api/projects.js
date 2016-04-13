import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Projects = new Mongo.Collection('projects');

Meteor.methods({
    'projects.insert'(name, description) {
        check(name, String);
        check(description, String);

        workflow = [{
            state: 'Open',
        }, {
            state:'Review',
            hasParticipants: true,
            participantsRole: 'Reviewer',
            nextState: 'Implementation',
            autoStateChange: true,
        }, {
            state:'Implementation',
            hasParticipants: true,
            participantsRole: 'Developer',
            nextState: 'Test',
            autoStateChange: false,
        }, {
            state: 'Closed'
        }];

        Projects.insert({
            name: name,
            description: description,
            createdAt: new Date(),
            createdBy: Meteor.user().username,
        });
    },
});
