import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { ConfigService } from '../config/config.service';
import { InterceptedHttp } from './../../http.interceptor';
import { SecurityInterceptedHttp } from '../../http.securityinterceptor';



/**
 * Author: Diamond Khanna ( 352929 )
 * Date: 11-10-2017
 * Objective: # A service which would handle the AGENT LIST services.
 */

@Injectable()
export class AgentListCreationService {
	admin_Base_Url: any;
	common_Base_Url: any;

	get_State_Url: any;
	get_Service_Url: any;
	get_Campaign_Names_Url: any;
	save_AgentListMapping_Url: any;


	constructor(private http: SecurityInterceptedHttp, public basepaths: ConfigService, private httpIntercept: InterceptedHttp) {
		this.admin_Base_Url = this.basepaths.getAdminBaseUrl();
		this.common_Base_Url = this.basepaths.getCommonBaseURL();

		this.get_State_Url = this.admin_Base_Url + "m/role/state";
		this.get_Service_Url = this.admin_Base_Url + "m/role/service";
		this.get_Campaign_Names_Url = this.common_Base_Url + "/cti/getCampaignNames";
		this.save_AgentListMapping_Url = this.admin_Base_Url + "createUSRAgentMapping";
	};

	getStates(serviceProviderID) {
		return this.http.post(this.get_State_Url, { "serviceProviderID": serviceProviderID })
			.map(this.handleState_n_ServiceSuccess)
			.catch(this.handleError);
	}

	getServices(serviceProviderID, stateID) {
		return this.http.post(this.get_Service_Url, {
			"serviceProviderID": serviceProviderID,
			"stateID": stateID
		}).map(this.handleState_n_ServiceSuccess)
			.catch(this.handleError);
	}

	getCampaignNames(serviceName) {
		return this.http.post(this.get_Campaign_Names_Url, { "serviceName": serviceName })
			.map(this.handleSuccess)
			.catch(this.handleError);
	}

	saveAgentListMapping(data) {
		return this.http.post(this.save_AgentListMapping_Url, data)
			.map(this.handleSuccess)
			.catch(this.handleError);
	}


	handleSuccess(res: Response) {
		console.log(res.json().data, "AGENT LIST CREATION file success response");
		if (res.json().data) {
			return res.json().data;
		} else {
		    return Observable.throw(res.json());
		}
	}

	handleState_n_ServiceSuccess(response: Response) {

		console.log(response.json().data, "role service file success response");
		let result = [];
		result = response.json().data.filter(function (item) {
			if (item.statusID != 4) {
				return item;
			}
		});
		return result;
	}

	handleError(error: Response | any) {
		return Observable.throw(error.json());
	}




};



