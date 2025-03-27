package com.numbermaze.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Enumeration;
import java.util.UUID;

/**
 * 通用Web请求日志拦截器，记录所有API请求的详细信息
 */
@Component
public class WebLogInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebLogInterceptor.class);
    private static final String REQUEST_ID = "requestId";
    private static final String START_TIME = "startTime";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 为每个请求生成唯一ID并放入MDC
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put(REQUEST_ID, requestId);
        
        // 记录请求开始时间
        long startTime = System.currentTimeMillis();
        request.setAttribute(START_TIME, startTime);

        // 记录请求URI、方法和IP地址
        String uri = request.getRequestURI();
        String method = request.getMethod();
        String remoteAddr = getClientIp(request);
        
        // 构建请求头信息日志
        StringBuilder reqHeadersLog = new StringBuilder();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            // 过滤掉敏感信息，如授权信息
            if (!"authorization".equalsIgnoreCase(headerName) && 
                !"cookie".equalsIgnoreCase(headerName)) {
                reqHeadersLog.append(headerName).append(": ")
                            .append(request.getHeader(headerName)).append(", ");
            }
        }
        
        // 记录详细的请求信息
        logger.info("API请求开始 | ID: {} | {} {} | 客户端IP: {} | Headers: [{}]", 
                requestId, method, uri, remoteAddr, 
                reqHeadersLog.length() > 0 ? reqHeadersLog.substring(0, reqHeadersLog.length() - 2) : "");
        
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
                           ModelAndView modelAndView) throws Exception {
        // 这里不需要实现，请求处理后的逻辑在afterCompletion中处理
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
            throws Exception {
        String requestId = MDC.get(REQUEST_ID);
        Long startTime = (Long) request.getAttribute(START_TIME);
        long endTime = System.currentTimeMillis();
        long processingTime = endTime - startTime;
        
        // 构建响应头信息日志
        StringBuilder respHeadersLog = new StringBuilder();
        response.getHeaderNames().forEach(headerName -> {
            respHeadersLog.append(headerName).append(": ")
                        .append(response.getHeader(headerName)).append(", ");
        });

        // 记录响应详情
        logger.info("API请求结束 | ID: {} | 状态码: {} | 耗时: {}ms | Headers: [{}]",
                requestId, response.getStatus(), processingTime,
                respHeadersLog.length() > 0 ? respHeadersLog.substring(0, respHeadersLog.length() - 2) : "");
        
        // 请求处理完毕，清除MDC中的数据
        MDC.remove(REQUEST_ID);
    }
    
    /**
     * 获取客户端真实IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // 多次代理的情况，第一个IP为客户端真实IP,多个IP按照','分割
            return xForwardedFor.split(",")[0];
        }
        
        String ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        
        return request.getRemoteAddr();
    }
}
