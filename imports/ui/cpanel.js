import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import '../api/projects';
import './cpanel.html';

Template.controlPanel.onCreated(function onCreated() {
});

Template.controlPanel.onRendered(function onRendered() {
    this.$('#switch-toggle-root').bootstrapSwitch();

    onShow = function(event) {
        $('#' + event.target.id).prev('div.panel-heading').find('a.accordion-toggle > span').removeClass('glyphicon-menu-right').addClass('glyphicon-menu-down');
    };

    onHide = function(event) {
        $('#' + event.target.id).prev('div.panel-heading').find('a.accordion-toggle > span').removeClass('glyphicon-menu-down').addClass('glyphicon-menu-right');
    };

    this.$('#collapse-add-user').on('show.bs.collapse', onShow);
    this.$('#collapse-add-user').on('hide.bs.collapse', onHide);

    this.$('#collapse-add-project').on('show.bs.collapse', onShow);
    this.$('#collapse-add-project').on('hide.bs.collapse', onHide);

    this.$('#collapse-add-workflow').on('show.bs.collapse', onShow);
    this.$('#collapse-add-workflow').on('hide.bs.collapse', onHide);
});

Template.controlPanel.helpers({
    users() {
        return Meteor.users.find({});
    },
    isRoot() {
        return Meteor.user().profile.isRoot;
    }
});

Template.controlPanel.events({
    'click [id=btn-add-user]'(event, template) {
        const username = $('#input-username').val();
        const password = $('#input-password').val();
        const isRoot = $('#switch-toggle-root').is(':checked');
        Accounts.createUser({username: username, password: password, profile: {isRoot: isRoot}});
    },
    'click [id=btn-add-project]'(event, template) {
        const projectName = $('#input-projname').val();
        const projectDescription = $('#txt-projdesc').val();
        const projectAdmin = $('#select-admin').val();

        Meteor.call('projects.insert', projectName, projectDescription, projectAdmin);

        $('#input-projname').val('');
        $('#txt-projdesc').val('');
        $('#select-admin').val('-1');
    },
});
