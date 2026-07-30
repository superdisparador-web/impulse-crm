const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Module, Injectable } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { PassportModule, PassportStrategy } = require('@nestjs/passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const { WhatsappController, WhatsappEmbeddedSignupCallbackController } = require('../dist/src/whatsapp/whatsapp.controller');
const { WhatsappService } = require('../dist/src/whatsapp/whatsapp.service');
const { EmbeddedSignupService } = require('../dist/src/whatsapp/embedded-signup/embedded-signup.service');
const { IamService } = require('../dist/src/iam/iam.service');
const secret = 'integration-jwt-secret-at-least-32-characters';
class FixtureJwtStrategy extends PassportStrategy(Strategy) { constructor(){super({jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),ignoreExpiration:false,secretOrKey:secret});} validate(p){return{id:p.sub,email:p.email,role:p.role};} }
Injectable()(FixtureJwtStrategy);
const embedded={createSession:async user=>({authorizationUrl:`https://www.facebook.com/v23.0/dialog/oauth?client_id=MASKED&state=MASKED&user=${user.id}`,expiresAt:new Date(Date.now()+600000).toISOString()}),complete:async q=>q.code&&q.state?'https://crm.example.test/whatsapp?connection=success':'https://crm.example.test/whatsapp?connection=error&reason=invalid_state'};
class HttpFixtureModule {}
Module({imports:[PassportModule],controllers:[WhatsappController,WhatsappEmbeddedSignupCallbackController],providers:[FixtureJwtStrategy,{provide:WhatsappService,useValue:{}},{provide:EmbeddedSignupService,useValue:embedded},{provide:IamService,useValue:{permissionsForUser:async id=>id==='allowed-user'?['whatsapp:accounts:create']:[]}}]})(HttpFixtureModule);
test('HTTP real registra session/callback e comprova 401, 403, JWT válido e redirect 303',async()=>{const app=await NestFactory.create(HttpFixtureModule,{logger:['log','error','warn']});await app.listen(0,'127.0.0.1');const base=`http://127.0.0.1:${app.getHttpServer().address().port}`;try{const anonymous=await fetch(`${base}/whatsapp/embedded-signup/session`,{method:'POST'});assert.equal(anonymous.status,401);const deniedToken=jwt.sign({sub:'denied-user',email:'denied@example.test',role:'BROKER'},secret,{expiresIn:'5m'});const denied=await fetch(`${base}/whatsapp/embedded-signup/session`,{method:'POST',headers:{authorization:`Bearer ${deniedToken}`}});assert.equal(denied.status,403);const token=jwt.sign({sub:'allowed-user',email:'admin@example.test',role:'ORG_ADMIN'},secret,{expiresIn:'5m'});const allowed=await fetch(`${base}/whatsapp/embedded-signup/session`,{method:'POST',headers:{authorization:`Bearer ${token}`}});const body=await allowed.json();assert.equal(allowed.status,201);assert.equal(new URL(body.authorizationUrl).hostname,'www.facebook.com');assert.deepEqual(Object.keys(body).sort(),['authorizationUrl','expiresAt']);const callback=await fetch(`${base}/whatsapp/embedded-signup/callback?code=mock-code&state=mock-state`,{redirect:'manual'});assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),'https://crm.example.test/whatsapp?connection=success');}finally{await app.close();}});
