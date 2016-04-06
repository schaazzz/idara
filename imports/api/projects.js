import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Projects = new Mongo.Collection('projects');

Meteor.methods({
    'projects.insert'(name, description) {
        check(name, String);
        check(description, String);

        console.log(name);
        console.log(description);
    },
    'projects.list'() {
        return 'user list';
    }
});
