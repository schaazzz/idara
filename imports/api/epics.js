import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Projects } from './projects';

export const Epics = new Mongo.Collection('epics');

if (Meteor.isServer) {
    Meteor.methods({
        'meteor.insert'(project, title, description, issues) {

        },
        'meteor.update'(project, title, description, issues) {
        },
    });
}
