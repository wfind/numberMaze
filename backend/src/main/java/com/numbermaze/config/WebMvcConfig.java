package com.numbermaze.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置类，用于注册拦截器
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final WebLogInterceptor webLogInterceptor;

    @Autowired
    public WebMvcConfig(WebLogInterceptor webLogInterceptor) {
        this.webLogInterceptor = webLogInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 为所有API路径添加日志拦截器
        registry.addInterceptor(webLogInterceptor)
                .addPathPatterns("/api/**");
    }
}
