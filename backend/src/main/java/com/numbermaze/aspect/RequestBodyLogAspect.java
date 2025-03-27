package com.numbermaze.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;

/**
 * AOP切面，用于记录请求和响应的详细内容
 */
@Aspect
@Component
public class RequestBodyLogAspect {

    private static final Logger logger = LoggerFactory.getLogger(RequestBodyLogAspect.class);

    /**
     * 环绕通知，记录控制器方法的请求参数和返回结果
     */
    @Around("execution(* com.numbermaze.controller.*Controller.*(..))")
    public Object logRequestBody(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String methodName = joinPoint.getSignature().getName();
            
            // 记录请求参数
            if (joinPoint.getArgs().length > 0) {
                logger.debug("请求方法: {}.{}, 参数: {}", 
                        joinPoint.getTarget().getClass().getSimpleName(), 
                        methodName, 
                        Arrays.toString(joinPoint.getArgs()));
            }
        }
        
        // 执行目标方法
        Object result = joinPoint.proceed();
        
        // 记录返回结果，但要避免日志过大
        if (result != null) {
            String resultStr = result.toString();
            // 如果结果太长，只记录部分
            if (resultStr.length() > 1000) {
                resultStr = resultStr.substring(0, 1000) + "... (结果已截断)";
            }
            logger.debug("方法返回: {}.{}, 结果: {}", 
                    joinPoint.getTarget().getClass().getSimpleName(),
                    joinPoint.getSignature().getName(), 
                    resultStr);
        }
        
        return result;
    }
}
