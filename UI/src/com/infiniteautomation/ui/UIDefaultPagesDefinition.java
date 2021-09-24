/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */
package com.infiniteautomation.ui;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.util.UriComponentsBuilder;

import com.serotonin.m2m2.db.dao.SystemSettingsDao;
import com.serotonin.m2m2.module.DefaultPagesDefinition;
import com.serotonin.m2m2.vo.User;

/**
 * Class that will allow overriding the default login page if the system setting is set to a valid string
 *
 * @author Terry Packer
 */
public class UIDefaultPagesDefinition extends DefaultPagesDefinition {

    @Autowired
    protected SystemSettingsDao systemSettingsDao;

    @Override
    public String getLoginPageUri(HttpServletRequest request, HttpServletResponse response) {
        return systemSettingsDao.getValue(UICommon.UI_LOGIN_PAGE);
    }

    @Override
    public String getLoginErrorUri(HttpServletRequest request, HttpServletResponse response) {
        return systemSettingsDao.getValue(UICommon.UI_LOGIN_ERROR_PAGE);
    }

    @Override
    public String getLogoutSuccessUri(HttpServletRequest request, HttpServletResponse response) {
        return systemSettingsDao.getValue(UICommon.UI_LOGOUT_SUCCESS_PAGE);
    }

    @Override
    public String getPasswordResetPageUri() {
        return systemSettingsDao.getValue(UICommon.UI_PASSWORD_RESET_PAGE);
    }

    @Override
    public String getFirstLoginPageUri(HttpServletRequest request, HttpServletResponse response) {
        return "/ui/agree-to-license";
    }

    @Override
    public String getLoggedInPageUri(HttpServletRequest request, HttpServletResponse response, User user) {
        return systemSettingsDao.getValue(UICommon.UI_LOGGED_IN_PAGE);
    }

    @Override
    public String getFirstUserLoginPageUri(HttpServletRequest request, HttpServletResponse response, User user) {
        return systemSettingsDao.getValue(UICommon.UI_FIRST_USER_LOGIN_PAGE);
    }

    @Override
    public String getLoggedInPageUriPreHome(HttpServletRequest request, HttpServletResponse response, User user) {
        return systemSettingsDao.getValue(UICommon.UI_LOGGED_IN_PAGE_PRE_HOME);
    }

    @Override
    public String getUnauthorizedPageUri(HttpServletRequest request, HttpServletResponse response, User user) {
        return systemSettingsDao.getValue(UICommon.UI_UNAUTHORIZED_PAGE);
    }

    @Override
    public String getNotFoundPageUri(HttpServletRequest request, HttpServletResponse response) {
        String page = systemSettingsDao.getValue(UICommon.UI_NOT_FOUND_PAGE);

        if (!StringUtils.isEmpty(page)) {
            if (request != null) {
                String requested = request.getRequestURI();
                return UriComponentsBuilder.fromPath(page).queryParam("path", requested).toUriString();
            }
            return page;
        } else {
            return null;
        }
    }

    @Override
    public String getErrorPageUri(HttpServletRequest request, HttpServletResponse response) {
        return systemSettingsDao.getValue(UICommon.UI_ERROR_PAGE);
    }

    @Override
    public String getEmailVerificationPageUri() {
        return systemSettingsDao.getValue(UICommon.UI_EMAIL_VERIFICATION_PAGE);
    }
}
