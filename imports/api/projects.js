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

        Projects.insert({
            name: name,
            description: description,
            createdAt: new Date(),
            createdBy: Meteor.user().username,
        });
    },
});
