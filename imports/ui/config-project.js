import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import './config-project.html';

var thisProject = null;
var pmUsersUpdated = new ReactiveVar(true);

Template.configProject.onCreated( function onCreated() {
    thisProject = Projects.findOne({'name': activeProject.get()})
});

Template.configProject.onRendered(function onRendered() {
    this.$('#input-projname').val(thisProject.name);
    this.$('#select-admin').val(thisProject.admin);
    this.$('#txt-projdesc').val(thisProject.description);
});

Template.configProject.helpers({
    users() {
        return Meteor.users.find({});
    },
    usersWithPmAcess() {
        if (pmUsersUpdated.get()) {
            pmUsersUpdated.set(false);
        }

        return thisProject.pmUsers;
    }
});

Template.configProject.events({
    'click [id=btn-save-changes]'(event, template) {
        Meteor.call(
            'projects.update',
            thisProject._id,
            $('#input-projname').val(),
            $('#txt-projdesc').val(),
            $('#select-admin').val(),
            thisProject.pmUsers);

        target.set('projects');
    },
    'click [id=btn-add-pm-user]'(event, template) {
        var selection = $('#select-pm-user').val();

        if(selection != -1) {
            if (thisProject.pmUsers.indexOf(selection) < 0) {
                thisProject.pmUsers.push(selection);
                pmUsersUpdated.set(true);
            }
        }
    },
    'click [name=a-remove-pm-user]'(event, template) {
        index = thisProject.pmUsers.indexOf(event.target.id);
        if (index >= 0) {
            thisProject.pmUsers.splice(index, 1);
            pmUsersUpdated.set(true);
        }
    }
});
