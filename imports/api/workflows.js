import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Workflows = new Mongo.Collection('workflows');

Meteor.methods({
    'workflows.insert'(workflowJSON) {
        Workflows.insert({
            workflow: workflowJSON,
        });
    }
});
