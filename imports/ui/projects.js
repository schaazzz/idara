import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import './projects.html';

Template.projects.onRendered(function onRendered() {
    this.$('[data-toggle=tooltip]').tooltip();
});

Template.projects.helpers({
    projects() {
        return Projects.find({}, {'_id': 0, 'name': 1, description: '1'});
    },
});

Template.projects.events({
    'click [name=show-project]': function (event, template) {
        activeProject.set(event.target.id);
        target.set('projectPage');
    }
});
