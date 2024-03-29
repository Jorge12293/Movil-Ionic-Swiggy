import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Address } from 'src/app/models/address.model';
import { GlobalService } from 'src/app/services/global/global.service';
import { GoogleMapsService } from 'src/app/services/google-maps/google-maps.service';
import { LocationService } from 'src/app/services/location/location.service';
import { AddressService } from '../../services/address/address.service';

@Component({
  selector: 'app-search-location',
  templateUrl: './search-location.component.html',
  styleUrls: ['./search-location.component.scss'],
})
export class SearchLocationComponent implements OnInit, OnDestroy {


  query: string = '';
  places: any[] = [];
  placeSub!: Subscription;
  @Input() from: any;
  savedPlaces: Address[] = [];
  addressSub!: Subscription;

  constructor(
    private global: GlobalService,
    private maps: GoogleMapsService,
    private locationService: LocationService,
    private addressService: AddressService
  ) { }

  ngOnInit() {
    this.placeSub = this.maps.places.subscribe(allPlaces => {
      this.places = allPlaces;
    });
    if (this.from) {
      this.getSavedPlaces();
    }
  }

  async getSavedPlaces() {
    this.global.showLoader();
    this.addressSub = this.addressService.addresses.subscribe(address => {
      this.savedPlaces = address;
      console.log(this.savedPlaces)
    });
    if(this.from == 'home'){
      await this.addressService.getAddresses(1);
    }else{
      await this.addressService.getAddresses();
    }
    this.global.hideLoader();
  }

  selectSavedPlace(place: Address) {
    this.dismiss(place)
  }

  ngOnDestroy(): void {
    if (this.placeSub) this.placeSub.unsubscribe();
    if (this.addressSub) this.addressSub.unsubscribe();
  }

  async onSearchChange(event: any) {
    console.log(event);
    this.global.showLoader();
    this.query = event.detail.value;
    if (this.query.length > 0) {
      await this.maps.getPlaces(this.query)
    }
    this.global.hideLoader();
  }


  dismiss(val?: any) {
    try{
      this.global.modalDismiss(val);
    }catch(error){
      console.log(error)
    }
  }

  choosePlace(place: any) {
    this.global.showLoader();
    if(this.from){
      const savedPlace =  this.savedPlaces.find(x=>x.lat === place.lat && x.lng === place.lng );
      if(savedPlace){
        place = savedPlace
      }
    }
    this.global.hideLoader();
    this.dismiss(place);
  }

  async getCurrentPosition() {
    try {
      this.global.showLoader();
      const position: any = await this.locationService.getCurrentLocation();
      console.log(position)
      const { latitude, longitude } = position?.coords;
      const results = await this.maps.getAddress(latitude, longitude);
      console.log(results);
      const place = {
        title: results.address_components[0].short_name,
        address: results.formatted_address,
        lat: latitude,
        lng: longitude
      }
      this.global.hideLoader();
      this.dismiss(place);
    } catch (error) {
      console.log(error)
      this.global.hideLoader();
      this.global.errorToast('Check wether GPS is enabled & the App has its permissions', 5000)
    }
  }


}
